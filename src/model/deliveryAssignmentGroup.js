const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");

const deliveryAssignmentGroupSchema = new mongoose.Schema({
  assignmentIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryAssignment", // assignment reference
      required: true,
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
  status: {
    type: String,
    default: "accepted",
    enum: ["accepted", "completed", "notDelivered"],
  },
  distanceTravelled: {
    type: Number,
  },
  totalEarning: {
    type: Number,
  },
});

deliveryAssignmentGroupSchema.plugin(timestamps);

module.exports = mongoose.model(
  "DeliveryAssignmentGroup",
  deliveryAssignmentGroupSchema
);
