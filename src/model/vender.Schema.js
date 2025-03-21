const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");
const { type } = require("os");

const venderSchema = mongoose.Schema({
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
    type: Number,
  },
  phoneOtp: {
    type: Number,
  },
  token: {
    type: String,
  },
  phone: {
    type: Number,
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
      enum: ["incompleted", "otpVerified", "step2Verified", "completed", "approved", "rejected"],
  },
  pincode: {
    type: String,
  },
  isPincodeApproved: {
    type: Boolean,
    default: false,
  },
  address: {
    type: String,
  },
  isAddressApproved: {
    type: Boolean,
    default: false,
  },
  storeName: {
    type: String,
  },
  storeUrl: {
    type: String,
  },
  storeDescription: {
    type: String,
  },
  storeAddress: {
    type: String,
  },
  taxName: {
    type: String,
  },
  taxNumber: {
    type: String,
  },
  storeLogo: {
    type: String,
  },
  signature: {
    type: String,
  },
  isStoreNameVerified: {
    type: Boolean,
    default:false,
  },
  isStoreUrlVerified: {
    type: Boolean,
    default:false,
  },
  isStoreDescriptionVerified: {
    type: Boolean,
    default:false,
  },
  isStoreAddressVerified: {
    type: Boolean,
    default:false,
  },
  isTaxNameVerified: {
    type: Boolean,
    default:false,
  },
  isTaxNumberVerified: {
    type: Boolean,
    default:false,
  },
  isStoreLogoVerified: {
    type: Boolean,
    default:false,
  },
  isSignatureVerified: {
    type: Boolean,
    default:false,
  },
  panCard: {
    type: String,
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

venderSchema.plugin(timestamps);
module.exports = mongoose.model("Vender", venderSchema);
