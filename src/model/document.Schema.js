const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");
const { type } = require("os");

const documentSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  status: {
    type: Boolean,
    default: true,
  }
});

tagSchema.plugin(timestamps);
module.exports = mongoose.model("Document", documentSchema);