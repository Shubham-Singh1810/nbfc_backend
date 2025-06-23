const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");
const { type } = require("os");

const transactionHistorySchema = mongoose.Schema({
  message: {
    type: String,
    required: true,
  },
  transactionType: {
    type: String,
    enum: ["credit", "debit", "hold"],
  },
  userId: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    // required: true,
  },
  userType: {
    type: String,
    enum: ["Vender", "Driver", "Admin"],
  },
  status: {
    type: Boolean,
    default: true,
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  date: { type: String },
});

transactionHistorySchema.plugin(timestamps);
module.exports = mongoose.model("TransactionHistory", transactionHistorySchema);
