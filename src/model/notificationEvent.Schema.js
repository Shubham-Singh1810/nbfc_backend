const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");
const { type } = require("os");

const notificationEventSchema = mongoose.Schema({
  event: {
    type: String,
  },
  title: {
    type: String,
  },
  subTitle: {
    type: String,
  },
  status:{
    type: Boolean,
    default:true
  },
  reciver:{
    type: String
  }
});

notificationEventSchema.plugin(timestamps);
module.exports = mongoose.model("NotificationEvent", notificationEventSchema);
