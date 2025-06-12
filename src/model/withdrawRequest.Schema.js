const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");
const { type } = require("os");

const withdrawRequestSchema = mongoose.Schema({
  userType: {
    type: String,
    required: true,
    enum: [
        "Driver",
        "Vender"
      ]
  },
  userId: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    default: "pending",
      enum: ["pending", "completed", "cancelled"],
  },
  rejectReason:{
    type:String
  },
  image: {
    type: String,
  }
});

withdrawRequestSchema.plugin(timestamps);
module.exports = mongoose.model("WithdrawRequest", withdrawRequestSchema);