const nodemailer = require("nodemailer");
const User = require("../model/user.Schema");

exports.sendEmailToUsers = async (notifyUserIds, title, subTitle, icon) => {
  const users = await User.find({ _id: { $in: notifyUserIds } }).select(
    "email"
  );
  const emailList = users.map((u) => u.email).join(",");
  if (!emailList) {
    console.log("No users found for email notification");
    return;
  }
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "tpaunikar92@gmail.com",
      pass: "yapnmzshchqbvnwy",
    },
  });
  const info = await transporter.sendMail({
    from: `"Rupee Loan" <"tpaunikar92@gmail.com">`,
    to: emailList,
    subject: title,
    html: `
        <div style="font-family:Arial; padding:10px;">
          <h3>${title}</h3>
          <p>${subTitle}</p>
          ${icon ? `<img src="${icon}" alt="icon" width="50" />` : ""}
        </div>
      `,
  });
  return info;
};

exports.sendSMSToUsers = async (notifyUserIds, title, subTitle, icon) => {
  console.log("sms");
};

exports.sendPushToUsers = async (notifyUserIds, title, subTitle, icon) => {
  console.log("push");
};
