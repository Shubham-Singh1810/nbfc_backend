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
  countryCode: {
    type: String,
    default: "91",
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
  emailOtp: {
    type: Number,
  },
  phoneOtp: {
    type: Number,
  },
  token: {
    type: String,
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
  bussinessLicense: {
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
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  isPhoneVerified: {
    type: Boolean,
    default: false,
  },
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
  isProfilePicApproved: {
    type: Boolean,
    default: false,
  },
  isPhoneApproved: {
    type: Boolean,
    default: false,
  },
  isStoreNameApproved: {
    type: Boolean,
    default: false,
  },
  isStoreUrlApproved: {
    type: Boolean,
    default: false,
  },
  isStoreAddressApproved: {
    type: Boolean,
    default: false,
  },
  isGstNumberApproved: {
    type: Boolean,
    default: false,
  },
  isStoreDescriptionApproved: {
    type: Boolean,
    default: false,
  },
  isBusinessLicenseApproved: {
    type: Boolean,
    default: false,
  },
  isStoreLogoApproved: {
    type: Boolean,
    default: false,
  },
  isAccountNumnerApproved: {
    type: String,
  },
  isIfceCodeApproved: {
    type: String,
  },
  isPanNumberApproved: {
    type: String,
  },
  isUpiIdApproved: {
    type: String,
  },
  isAccountHolderNameApproved: {
    type: String,
  },
  isBankNameApproved: {
    type: String,
  },
  isBankBranchCodeApproved: {
    type: String,
  },
  isSignatureApproved: {
    type: String,
  },
  isAdharCardApproved: {
    type: String,
  },
  isPassBookApproved: {
    type: String,
  },

  // reject reason 
  firstNameRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  
  lastNameRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  
  emailRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  
  profilePicRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  
  phoneRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  
  storeNameRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  
  storeUrlRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  
  storeAddressRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  
  gstNumberRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  
  storeDescriptionRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  
  businessLicenseRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  
  storeLogoRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  
  accountNumberRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  
  ifceCodeRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  
  panNumberRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  
  upiIdRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  
  accountHolderNameRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  
  bankNameRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  
  bankBranchCodeRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  
  signatureRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  
  adharCardRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  
  passBookRejectReason: {
    type: String,
    default: "waiting for approval",
  },  
  
});

venderSchema.plugin(timestamps);
module.exports = mongoose.model("Vender", venderSchema);
