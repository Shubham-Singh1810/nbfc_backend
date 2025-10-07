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
    default: true,
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
  },
  creditScoreRequired: {
    type: Number,
  },
  minAge: {
    type: Number,
  },
  maxAge: {
    type: Number,
  },
  employmentTypesAllowed: [
    {
      type: String,
    },
  ],
  DTIR: {
    type: Number,
  },
  // -----
  collateralRequired: {
    type: Boolean,
    Boolean: false,
  },
  collateralTypes: [
    {
      type: String,
    },
  ],
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
    default: false,
    required: true,
  },
  // ----
  documentRequired: [
    {
      type: String,
      required: true,
    },
  ],
  // ----
  isActiveOnWeb: { type: Boolean, default:false },
  title: { type: String },
  slug: { type: String },
  banner: { type: String },
  seoTitle: { type: String },
  metaKeywords: { type: String },
  metaDescription: { type: String },
});

loanSchema.plugin(timestamps);
module.exports = mongoose.model("Loan", loanSchema);
