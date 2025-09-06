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
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  dob: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    required: true,
  },
  profileStatus: {
    type: String,
    default: "registered",
    enum: ["registered", "verified", "active", "blocked"],
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
    required: true,
  },
  //  -----------------
  panNumber: {
    type: String,
    
  },
   aadharNumber: {
    type: String,
    required: true,
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
});

userSchema.plugin(timestamps);
module.exports = mongoose.model("User", userSchema);
