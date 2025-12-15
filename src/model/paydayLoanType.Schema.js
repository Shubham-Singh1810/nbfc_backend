const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");
const { type } = require("os");

const paydayLoanTypeSchema = mongoose.Schema({
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
  processingFee: {
    type: Number,
    required: true,
  },
  gstApplicable: {
    type: Boolean,
    default: true,
  },
  gst: {
    type: Number,
    default:0
  },
  lateFee: {
    type: Number,
    required: true,
  },
  penaltyGraceDays: {
    type: Number,
    required: true,
  },
  prepaymentAllowed: {
    type: Boolean,
    default: true,
  },
  prepaymentFee: {
    type: Number,
    required: true,
  },

  // -------------
  minIncome: {
    type: Number,
  },
  maxEmiRatio: {
    type: Number,
  },
  incomeToLoanPercentage: {
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
  documentRequired: [
    {
      type: String,
      required: true,
    },
  ],
});

paydayLoanTypeSchema.plugin(timestamps);
module.exports = mongoose.model("PaydayLoanType", paydayLoanTypeSchema);
