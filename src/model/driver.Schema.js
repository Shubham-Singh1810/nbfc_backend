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
  lastName: {
    type: String,
  },
  isLastNameApproved: {
    type: Boolean,
    default: false,
  },
  email: {
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
  profilePic: {
    type: String,
  },
  isProfilePicApproved: {
    type: Boolean,
    default: false,
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
  profileStatus:{
    type: String,
    default: "incompleted",
    required: true,
      enum: ["incompleted", "completed", "approved", "rejected"],
  },
  dlFrontImage: {
    type: String,
    required: true,
  },
  isDlFrontImageApproved: {
    type: Boolean,
    default: false,
  },
  dlBackImage: {
    type: String,
    // required: true,
  },
  isDlBackImageApproved: {
    type: Boolean,
    default: false,
  },
  pincode: {
    type: String,
    required: true,
  },
  isPincodeApproved: {
    type: Boolean,
    default: false,
  },
  address: {
    type: String,
    required: true,
  },
  isAddressApproved: {
    type: Boolean,
    default: false,
  },
});

driverSchema.plugin(timestamps);
module.exports = mongoose.model("Driver", driverSchema);
