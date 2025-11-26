const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");
const { type } = require("os");

const notificationConfigrationSchema = mongoose.Schema({
  isEmailNotification: {
    type: Boolean,
  },
  isSmsNotification: {
    type: Boolean,
  },
  isPushNotification: {
    type: Boolean,
  },
  isInAppNotification: {
    type: Boolean,
  },
});

notificationConfigrationSchema.plugin(timestamps);
module.exports = mongoose.model(
  "NotificationConfigration",
  notificationConfigrationSchema
);
