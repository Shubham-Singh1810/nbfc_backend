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
    ref: "LoanPurpose",
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
    enum: ["pending", "approved", "rejected", "disbursed", "overdue", "completed"],
  },
  code: {
    type: String,
  },
  rejectReason: {
    type: String,
  },
  // processing status
  processingStatus: {
    type: String,
    default: "checkEligibility",
    enum: [
      "checkEligibility", 
      "ekyc",
      "selfie",
      "bankStatement",
      "loanOffer",
      "residenceProof",
      "reference",
      "bankDetails",
      "eSign",
    ],
  },
  step:  {
    type: Number,
  },
  // Check Eligibility
  fullName: {
    type: String,
  },
  email: {
    type: String,
  },
  dob: {
    type: String,
  },
  gender: {
    type: String,
    enum: ["male", "female", "other"],
  },
  educationQ: {
    type: String,
  },
  maritalStatus: {
    type: String,
  },
  empType: {
    type: String,
  },
  cmpName: {
    type: String,
  },
  monthlyIncome: {
    type: String,
  },
  monthlyExpense: {
    type: String,
  },
  nextSalary: {
    type: String,
  },
  pincode: {
    type: String,
  },
  area: {
    type: String,
  },
  currentAddress: {
    type: String,
  },
  currentAddressOwnership: {
    type: String,
  },
  whoYouliveWith: {
    type: String,
  },
  // e-kyc
  adharFrontend: {
    type: String,
  },
  adharBack: {
    type: String,
  },
  pan: {
    type: String,
  },
  // selfie
  selfie: {
    type: String,
  },
  selfieApprovalStatus: {
    type: String,
    enum:["pending","uploaded", "approved", "rejected"],
    default:"pending"
  },
  // bank statement
  bankVerificationMode: {
    type: String,
  },
  loanAmount: {
    type: Number,
  },
  tenure: {
    type: Number,
  },
  // residence proof
  residenceProofType: {
    type: String,
  },
  residenceProof: {
    type: String,
  },
  // reference
  referenceName: {
    type: String,
  },
  referenceRelation: {
    type: String,
  },
  referencePhone: {
    type: String,
  },
  // banking details
  bankName: {
    type: String,
  },
  acountHolderName: {
    type: String,
  },
  acountNumber: {
    type: String,
  },
  ifscCode: {
    type: String,
  },
  // e-sigm
  eSign: {
    type: String,
  },
    
  
  // configration details
  payable: {
    type: Number,
  },
  interestRate: {
    type: Number,
  },
  interestAmount: {
    type: Number,
  },
  processingFee: {
    type: Number,
  },
  processingAmount: {
    type: Number,
  },
  isGstApplicable: {
    type: Boolean,
  },
   gstRate: {
    type: Number,
  }, 
  gstAmount: {
    type: Number,
  },
  lateFee: {
    type: Number,
  },
  penaltyGraceDays: {
    type: Number,
  },
  isPrepaymentAllowed: {
    type: Boolean,
  },
  prepaymentFee: {
    type: Number,
  },
  disbursedAmount : {
    type: Number,
  },
});

paydayLoanApplicationSchema.plugin(timestamps);
module.exports = mongoose.model(
  "PaydayLoanApplication",
  paydayLoanApplicationSchema
);
