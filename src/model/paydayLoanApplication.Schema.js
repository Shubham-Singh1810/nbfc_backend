const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");

const paydayLoanApplicationSchema = mongoose.Schema({
  // important Id
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
  // processing status
  processingStatus: {
    type: String,
    default: "checkEligibility",
    enum: ["checkEligibility", "ekyc", "selfie", "bankStatement", "loanOffer","residenceProof", "reference", "bankDetails", "eSign"],
  },
  // Check Eligibility
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  dob: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    enum: ["male", "female", "other"],
  },



  status: {
    type: String,
    default: "pending",
    enum: ["pending", "approved", "rejected", "disbursed", "completed"],
  },
  code: {
    type: String,
  },
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
