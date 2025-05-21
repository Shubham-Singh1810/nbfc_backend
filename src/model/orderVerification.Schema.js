const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");

const orderVerificationSchema = mongoose.Schema({
  productIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
  ],
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver",
  },
  image: {
    type: String,
    required: true,
  },
  isOtpVerified: {
    type: Boolean,
    default: false,
  },
  otp: {
    type: String,
    // required: true,
  },
});

orderVerificationSchema.plugin(timestamps);
module.exports = mongoose.model("OrderVerification", orderVerificationSchema);
