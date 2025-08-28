const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");
const { type } = require("os");

const userSchema = mongoose.Schema({
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  code: {
    type: String,
  },
  email: {
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
  profileStatus: {
    type: String,
    default: "registered",
    enum: ["registered", "verified", "active", "blocked"],
  },
  deviceId: {
    type: String,
  },
  dob: {
    type: String,
  },
  gender: {
    type: String,
  },
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
  deptToIncomeRatio: {
    type: Number,
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
  uploaded_documents: [
    {
      name: { type: String },
      image: { type: String },
    },
  ],
  wallet: {
    type: String,
  },
});

userSchema.plugin(timestamps);
module.exports = mongoose.model("User", userSchema);
