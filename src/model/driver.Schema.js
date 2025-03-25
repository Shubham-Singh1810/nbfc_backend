const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");
const { type } = require("os");

const driverSchema = mongoose.Schema({
  firstName: {
    type: String,
  },
  isFirstNameApproved: {
    type: Boolean,
    default: false,
  },
  firstNameRejectReason: {
    type: String,
  },
  lastName: {
    type: String,
  },
  isLastNameApproved: {
    type: Boolean,
    default: false,
  },
  lastNameRejectReason: {
    type: String,
  },
  email: {
    type: String,
  },
  emailRejectReason: {
    type: String,
  },
  isEmailApproved: {
    type: Boolean,
    default: false,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailOtp: {
    type: String,
  },
  phone: {
    type: String,
    required: true,
  },
  phoneOtp: {
    type: String,
  },
  phoneRejectReason: {
    type: String,
  },
  isPhoneVerified: {
    type: Boolean,
    default: false,
  },
  isPhoneApproved: {
    type: Boolean,
    default: false,
  },
  isProfilePicApproved: {
    type: Boolean,
    default: false,
  },
  profilePic: {
    type: String,
  },
  profilePicRejectReason: {
    type: String,
  },

  countryCode: {
    type: String,
    default: "91",
  },
  profileStatus: {
    type: String,
    default: "incompleted",
    required: true,
    enum: ["incompleted", "completed", "approved", "rejected", "reUploaded"],
  },
  dlFrontImage: {
    type: String,
    required: true,
  },
  dlFrontImageRejectReason: {
    type: String,
  },
  isDlFrontImageApproved: {
    type: Boolean,
    default: false,
  },
  dlBackImage: {
    type: String,
    // required: true,
  },
  dlBacktImageRejectReason: {
    type: String,
  },
  isDlBackImageApproved: {
    type: Boolean,
    default: false,
  },
  pincode: {
    type: String,
    required: true,
  },
  pincodeRejectReason: {
    type: String,
  },
  isPincodeApproved: {
    type: Boolean,
    default: false,
  },
  address: {
    type: String,
    required: true,
  },
  addressRejectReason: {
    type: String,
  },
  isAddressApproved: {
    type: Boolean,
    default: false,
  },
  lat: {
    type: String,
  },
  long: {
    type: String,
  },
  androidDeviceId: {
    type: String,
  },
  iosDeviceId: {
    type: String,
  },
  token: {
    type: String,
  },
  password: {
    type: String,
  },
});

driverSchema.plugin(timestamps);
module.exports = mongoose.model("Driver", driverSchema);
