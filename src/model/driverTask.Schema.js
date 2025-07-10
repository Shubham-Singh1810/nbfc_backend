const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");
const { type } = require("os");

const driverTaskSchema = mongoose.Schema({
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver",
    required: true,
  },
  OrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },
  product: [
    {
      productId: { type: String, ref: "Product" },
      quantity: { type: Number },
    },
  ],
  pickUpLat: {
    type: String,
  },
  pickUpLong: {
    type: String,
  },
  dropOffLat: {
    type: String,
  },
  dropOffLong: {
    type: String,
  },
  deliveryDate: {
    type: String,
  },
});

addressSchema.plugin(timestamps);
module.exports = mongoose.model("DriverTask", driverTaskSchema);
