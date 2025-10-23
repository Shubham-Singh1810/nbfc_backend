const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");
const { type } = require("os");

const paydayLoanApplicationSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  loanPurposeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Loan Purpose",
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
  },
  assignedAdminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
  },
  status: {
    type: String,
    default: "pending",
    enum: ["pending", "approved", "rejected", "disbursed", "completed"],
  },
  code: {
    type: String,
  },
  documents: [
    {
      name: { type: String },
      image: { type: String },
      status: { type: String, default: "pending", enum: ["pending", "approved", "rejected"], },
      rejectReason:{type:String}
    },
  ],
  rejectReason:{
    type:String
  },
  loanAmount: {
    type: Number,
    required: true,
  },
  loanTenuare: {
    type: Number,
    required: true,
  },
  intrestRate: {
    type: Number,
    required: true,
  },
  
  repaymentFrequency: {
    type: Number,
    required: true,
  },
  repaymentFrequencyType: {
    type: String,
    required: true,
  },
  startDate: {
    type: String,
  },
  endDate: {
    type: String,
  },
  panNumber: {
    type: String,
  },
  creditScore: {
    type: String,
  },
});

paydayLoanApplicationSchema.plugin(timestamps);
module.exports = mongoose.model("PaydayLoanApplication", paydayLoanApplicationSchema);
