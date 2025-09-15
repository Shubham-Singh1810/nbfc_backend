const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");
const { type } = require("os");

const ticketSchema = mongoose.Schema({
  subject: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  image: {
    type: String,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
  },
  status: {
    type: String,
    enum: ["open", "closed"],
    default:"open"
  },
  ticketCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TicketCategory",
    required: true,
  },
});

ticketSchema.plugin(timestamps);
module.exports = mongoose.model("Ticket", ticketSchema);
