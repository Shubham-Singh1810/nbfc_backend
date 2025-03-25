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
  password: {
    type: String,
  },
  emailOtp: {
    type: String,
  },
  phoneOtp: {
    type: String,
  },
  token: {
    type: String,
  },
  phone: {
    type: String,
    required: true,
  },
  phoneRejectReason: {
    type: String,
  },
  profilePic: {
    type: String,
  },
  isProfilePicApproved: {
    type: Boolean,
    default: false,
  },
  profilePicRejectReason: {
    type: String,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  isEmailApproved: {
    type: Boolean,
    default: false,
  },
  isPhoneVerified: {
    type: Boolean,
    default: false,
  },
  isPhoneApproved: {
    type: Boolean,
    default: false,
  },
  countryCode: {
    type: String,
    default: "91",
  },
  profileStatus: {
    type: String,
    default: "incompleted",
    required: true,
    enum: ["incompleted", "completed", "approved", "rejected"],
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
});

driverSchema.plugin(timestamps);
module.exports = mongoose.model("Driver", driverSchema);
