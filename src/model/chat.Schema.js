const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");
const { type } = require("os");

const chatSchema = mongoose.Schema({
  message: {
    type: String,
  },
  image: {
    type: String,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
  },
  userType: {
    type: String,
    enum: ["User", "Admin"],
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ticket",
    required: true,
  },
});

chatSchema.plugin(timestamps);
module.exports = mongoose.model("Chat", chatSchema);
