const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");
const { type } = require("os");

const attributeSetSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
  image: {
    type: String,
    required: true,
  },
});

attributeSetSchema.plugin(timestamps);
module.exports = mongoose.model("AttributeSet", attributeSetSchema);