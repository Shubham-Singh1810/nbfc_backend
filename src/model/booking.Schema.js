const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");

const bookingSchema = mongoose.Schema({
  totalAmount: {
    type: String,
  },
  status: {
    type: String,
    enum: ["orderPlaced", "partiallyDelivered", "completed", "cancelled"],
  },
  signature: {
    type: String,
    required: true,
  },
  orderId: {
    type: String,
    required: true,
  },
  modeOfPayment: {
    type: String,
    enum: ["COD", "Online"],
  },
  paymentId: {
    type: String,
  },
  product: [
    {
      productId: { type: String, ref: "Product" },
      quantity: { type: Number },
      totalPrice: { type: Number },
      deliveryStatus: {
        type: String,
        enum: [
          "orderPlaced",
          "orderPacked",
          "driverAssigned",
          "driverAccepted",
          "pickedOrder",
          "completed",
          "cancelled",
        ],
      },
      driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Driver",
      },
      venderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vender",
      },
      cancelledBy: {
        type: String,
        enum: [
          "Driver",
          "User",
          "Vender"
        ]
      },
      cancelReason: {
        type: String,
      },
      orderNotDeliveredReason: {
        type: String,
      },
      expectedDeliveryDate: {
        type: String,
      },
    },
  ],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  addressId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Address",
    required: true,
  },
});

bookingSchema.plugin(timestamps);
module.exports = mongoose.model("Booking", bookingSchema);
