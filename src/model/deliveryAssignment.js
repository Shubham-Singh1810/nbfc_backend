const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");

const deliveryAssignmentSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking", // Booking reference
    required: true,
  },
  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product", // Product reference
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
    },
  ],
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver", // Reference to Driver schema
    required: true,
  },
  deliveryDate: {
    type: Date, // Changed to Date type instead of String
    required: true,
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vender",
    required: true,
  },
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
  pickUpPoint: {
    lat: {
      type: String,
      required: true,
    },
    long: {
      type: String,
      required: true,
    },
  },
  dropOffPoint: {
    lat: {
      type: String,
      required: true,
    },
    long: {
      type: String,
      required: true,
    },
  },
  status:{
    type:String,
    default: "pending",
    enum: ["pending","recived", "completed","notDelivered"],
  },
  reasonForNotDelivered:{
    type:String,
  }
});

deliveryAssignmentSchema.plugin(timestamps);

module.exports = mongoose.model("DeliveryAssignment", deliveryAssignmentSchema);
