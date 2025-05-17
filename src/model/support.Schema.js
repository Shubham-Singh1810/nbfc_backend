const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");
const { type } = require("os");

const supportSchema = mongoose.Schema({
  userPrivacyPolicy: {
    type: String,
  },
  driverPrivacyPolicy: {
    type: String,
  },
  vendorPrivacyPolicy: {
    type: String,
  },
  userTermsAndCondition: {
    type: String,
  },
  driverTermsAndCondition: {
    type: String,
  },
  vendorTermsAndCondition: {
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
