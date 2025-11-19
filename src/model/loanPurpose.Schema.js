const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");
const { type } = require("os");

const loanPurposeSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
   img: {
    type: String,
  },
   description: {
    type: String,
    required: true,
  },
  status: {
    type: Boolean,
    default: true,
  }
});

loanPurposeSchema.plugin(timestamps);
module.exports = mongoose.model("LoanPurpose", loanPurposeSchema);