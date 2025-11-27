const cron = require("node-cron");
const moment = require("moment");
const Notify = require("../model/notify.Schema");
const { sendEmailToUsers, sendSMSToUsers, sendPushToUsers } = require("../utils/notify");

module.exports = function startCronScheduler() {
  cron.schedule("* * * * *", async () => {
    try {
      const now = moment().format("YYYY-MM-DD HH:mm");
      const pendingJobs = await Notify.find({
        isScheduled: true,
        isDelivered: false,
        scheduledAt: { $lte: now },
      });

      for (let job of pendingJobs) {
        const { notifyUserIds, title, subTitle, mode, icon } = job;
        if (mode.includes("email")) {
          sendEmailToUsers(notifyUserIds, title, subTitle, icon);
        }
        if (mode.includes("text")) {
          sendSMSToUsers(notifyUserIds, title);
        }
        if (mode.includes("push")) {
          sendPushToUsers(notifyUserIds, title, subTitle, icon);
        }

        job.isDelivered = true;
        await job.save();
      }
    } catch (err) {
      console.error("Cron Error:", err);
    }
  });

  console.log("⏱ Cron Scheduler Started...");
};
