const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");

const adminFundSchema = mongoose.Schema({
  venderCommision: {
    type: Number,
  },
  driverCommision: {
    type: Number,
  },
  wallet: {
    type: Number,
    default: 0
  },
  transactionHistory: [
    {
      message: { type: String },
      transactionType: { type: String },
      date: { type: String },
    }
  ],
    totalEarnings: {
      type: Number,
      default: 0,
    }
});

adminFundSchema.plugin(timestamps);
module.exports = mongoose.model("AdminFund", adminFundSchema);