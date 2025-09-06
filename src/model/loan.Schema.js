const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");
const { type } = require("os");

const loanSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  status: {
    type: Boolean,
    default:true
  },
  icon: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  // --------
  minAmount: {
    type: Number,
  },
  maxAmount: {
    type: Number,
  },
  minTenure: {
    type: Number,
  },
   maxTenure: {
    type: Number,
  },
  intrestRate: {
    type: Number,
  },
  intrestType: {
      type: String,
      enum: ["flat", "reducing", "simple", "compound"], // ✅ enum set
      required: true,
  },
  repaymentFrequency: {
    type: Number,
  },
  // ----
  minAmountDays: {
    type: Number,
  },
  maxAmountDays: {
    type: Number,
  },
  minTenureDays: {
    type: Number,
  },
   maxTenureDays: {
    type: Number,
  },
  intrestRateDays: {
    type: Number,
  },
  intrestTypeDays: {
    type: String,
  },
  repaymentFrequencyDays: {
    type: Number,
  },
  // -------------
  minIncome: {
    type: Number,
    required:true
  },
  creditScoreRequired: {
    type: Number,
    required:true
  },
  minAge: {
    type: Number,
    required:true
  },
  maxAge: {
    type: Number,
    required:true
  },
  employmentTypesAllowed: [{
    type: String,
    required:true
  }],
  DTIR: {
    type: Number, 
    required:true
  },
  // -----
  collateralRequired: {
    type: Boolean,
    Boolean:false,
  },
  collateralTypes: [{
    type: String,
  
  }],
  maxLTV: {
    type: Number,
  },
  // ------
  processingFee: {
    type: Number,
    required: true,
  },
  latePaymentPenalty: {
    type: Number,
    required: true,
  },
  prepaymentFee: {
    type: Number,
    required: true,
  },
  // ------
  auto_approval: {
    type: Boolean,
    default:false,
    required: true,
  },
  // ----
  documentRequired: [{
    type: String,
    required: true,
  }],
});

loanSchema.plugin(timestamps);
module.exports = mongoose.model("Loan", loanSchema);
