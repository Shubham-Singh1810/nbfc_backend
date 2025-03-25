const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");
const { type } = require("os");

const attributeSchema = mongoose.Schema({
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
  value: {
    type: [String],
    required: true,
  },
  attributeSetId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "AttributeSet",
          required: true, 
      },
});

attributeSchema.plugin(timestamps);
module.exports = mongoose.model("Attribute", attributeSchema);