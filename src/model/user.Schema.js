const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");
const { type } = require("os");

const userSchema = mongoose.Schema({
  code: {
    type: String,
  },
  token: {
    type: String,
  },
  profilePic: {
    type: String,
  },
  deviceId: {
    type: String,
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
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  isPhoneVerified: {
    type: Boolean,
    default: false,
  },
  countryCode: {
    type: String,
    default: "91",
  },
  kycStatus: {
    type: Number,
  },
  loanHistory: [
    {
      loanApplicationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LoanApplication",
      },
    },
  ],
  lastLogin: {
    type: String,
  },
  // -------------
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
    type: String,
    required: true,
  },
  dob: {
    type: String,
  },
  gender: {
    type: String,
  },
  profileStatus: {
    type: String,
    default: "registered",
    enum: ["registered", "verified", "profileUpdated", "active", "blocked"],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
  },
  isUserApproved:{
    type: Boolean,
    default: true,
  },

  // ----------------
  state: {
    type: String,
  },
  city: {
    type: String,
  },
  pincode: {
    type: String,
  },
  landmark: {
    type: String,
  },
  residenceType: {
    type: String,
    enum: ["owned", "rented", "company_provided", "other"],
  },
  address: {
    type: String,
  },
  //  -----------------
  panNumber: {
    type: String,
  },
  aadharNumber: {
    type: String,
  },
  //  -------------
  employementType: {
    type: String,
  },
  monthlyIncome: {
    type: Number,
  },
  annualIncome: {
    type: Number,
  },
  creditScore: {
    type: Number,
  },
  salaryDate:{
    type:String
  },
  salaryType:{
    type:String
  },
  contacts:[]
});

userSchema.plugin(timestamps);
module.exports = mongoose.model("User", userSchema);
