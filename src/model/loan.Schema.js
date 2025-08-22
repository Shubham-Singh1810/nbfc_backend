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
  minAmount: {
    type: Number,
    required: true,
  },
  maxAmount: {
    type: Number,
    required: true,
  },
  minTenure: {
    type: Number,
    required: true,
  },
  intrestRate: {
    type: Number,
    required: true,
  },
  intrestType: {
    type: String,
    required: true,
    enum: ["simple", "compound"],
  },
  repaymentFrequency: {
    type: Number,
    required: true,
  },
  collateralRequired: {
    type: Boolean,
    required: true,
  },
  collateralTypes: {
    type: String,
    required: true,
  },
  maxLTV: {
    type: Number,
    required: true,
  },
  minAge: {
    type: Number,
  },
  maxAge: {
    type: Number,
  },
  minIncome: {
    type: Number,
  },
  creditScoreRequired: {
    type: Number,
  },
  employmentTypesAllowed: [{
    type: String,
  }],
  processingFee: {
    type: Number,
  },
  latePaymentPenalty: {
    type: Number,
  },
  prepaymentFee: {
    type: Number,
  },
  description: {
    type: String,
  },
  status: {
    type: String,
    enum :["active", "inactive"]
  },
  auto_approval: {
    type: Boolean,
  },
});

loanSchema.plugin(timestamps);
module.exports = mongoose.model("Loan", loanSchema);
