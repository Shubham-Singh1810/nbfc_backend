const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");

const loanApplicationSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  loanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Loan",
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
  emiSchedule: [
    {
      expectedDate: { type: String },
      transectionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Transection",
      },
      amount: { type: Number },
      status: {
        type: String,
        default: "pending",
        enum: ["pending", "completed"],
      },
      paidDate: { type: String },
    },
  ],
  collateralDetails: [
    {
      name: { type: String },
      rejectReason: { type: String },
      description: { type: String },
      status: {
        type: String,
        default: "pending",
        enum: ["pending", "approved", "rejected", "reuploaded"],
      },
    },
  ],
  loanAmount: {
    type: Number,
    required: true,
  },
  loanTenuare: {
    type: Number,
    required: true,
  },
  loanTenuareType: {
    type: String,
    required: true,
  },
  intrestRate: {
    type: Number,
    required: true,
  },
  intrestRateType: {
    type: String,
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
});

loanApplicationSchema.plugin(timestamps);
module.exports = mongoose.model("LoanApplication", loanApplicationSchema);
