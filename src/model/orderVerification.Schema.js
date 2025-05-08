const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");

const orderVerificationSchema = mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, ref: "Product"
 },
  driverId: {
    type: mongoose.Schema.Types.ObjectId, ref: "Driver"
},
  image: {
    type: String,
    required: true,
  },
  isOtpVerified: {
    type: Boolean,
    default: false,
  },
  verifyOtp: {
    type: String,
    required: true,
  },

});

orderVerificationSchema.plugin(timestamps);
module.exports = mongoose.model("OrderVerification", orderVerificationSchema);
