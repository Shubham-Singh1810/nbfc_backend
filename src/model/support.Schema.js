const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");
const { type } = require("os");

const supportSchema = mongoose.Schema({
  privacyPolicy: {
    type: String,
  },
  termsAndCondition: {
    type: String,
  },
  cookiePolicy: {
    type: String,
  },
  supportContact: {
    type: String,
  },
  supportEmail: {
    type: String,
  },
});

supportSchema.plugin(timestamps);
module.exports = mongoose.model("Support", supportSchema);
