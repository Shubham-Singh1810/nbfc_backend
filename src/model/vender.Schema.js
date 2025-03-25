const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");
const { type } = require("os");

const venderSchema = mongoose.Schema({
  // sign up ---fields
  profilePic: {
    type: String,
  },
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  email: {
    type: String,
  },
  phone: {
    type: Number,
    required: true,
  },
  password: {
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

  // store details
  storeName: {
    type: String,
  },
  storeUrl: {
    type: String,
  },
  address: {
    type: String,
  },
  state: {
    type: String,
  },
  district: {
    type: String,
  },
  pincode: {
    type: String,
  },
  gstNumber: {
    type: String,
  },
  storeDescription: {
    type: String,
  },
  bussinessLicensee: {
    type: String,
  },
  storeLogo: {
    type: String,
  },

  // account details

  accountNumner: {
    type: String,
  },
  ifceCode: {
    type: String,
  },
  panNumber: {
    type: String,
  },
  upiId: {
    type: String,
  },
  accountHolderName: {
    type: String,
  },
  bankName: {
    type: String,
  },
  bankBranchCode: {
    type: String,
  },
  signature: {
    type: String,
  },
  adharCard: {
    type: String,
  },
  passBook: {
    type: String,
  },

  // details for verification

  isFirstNameApproved: {
    type: Boolean,
    default: false,
  },

  isLastNameApproved: {
    type: Boolean,
    default: false,
  },

  isEmailApproved: {
    type: Boolean,
    default: false,
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
  profileStatus: {
    type: String,
    default: "incompleted",
    required: true,
    enum: [
      "incompleted",
      "otpVerified",
      "storeDetailsCompleted",
      "completed",
      "approved",
      "rejected",
    ],
  },

  isPincodeApproved: {
    type: Boolean,
    default: false,
  },

  isAddressApproved: {
    type: Boolean,
    default: false,
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
    default: false,
  },
  isStoreUrlVerified: {
    type: Boolean,
    default: false,
  },
  isStoreDescriptionVerified: {
    type: Boolean,
    default: false,
  },
  isStoreAddressVerified: {
    type: Boolean,
    default: false,
  },
  isTaxNameVerified: {
    type: Boolean,
    default: false,
  },
  isTaxNumberVerified: {
    type: Boolean,
    default: false,
  },
  isStoreLogoVerified: {
    type: Boolean,
    default: false,
  },
  isSignatureVerified: {
    type: Boolean,
    default: false,
  },
});

venderSchema.plugin(timestamps);
module.exports = mongoose.model("Vender", venderSchema);
