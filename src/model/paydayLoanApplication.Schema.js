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
  payable: {
    type: Number,
  },
  processingFee: {
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
  gstAmount: {
    type: Number,
  },
  gstRate: {
    type: Number,
  },  
  interestRate: {
    type: Number,
  },       
});

paydayLoanApplicationSchema.plugin(timestamps);
module.exports = mongoose.model(
  "PaydayLoanApplication",
  paydayLoanApplicationSchema
);
