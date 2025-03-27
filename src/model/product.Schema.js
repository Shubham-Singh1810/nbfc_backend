const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");
const { type } = require("os");

const productSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  productHeroImage: {
    type: String,
  },
  productGallery: {
    type: [String],
    required: true,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  subCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubCategory",
    required: true,
  },
  price: { type: Number },
  discountedPrice: { type: Number },
  description: { type: String },
  codAvailable: {
    type: Boolean,
    default: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBY: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "venderId",
    required: true,
  },
});

productSchema.plugin(timestamps);
module.exports = mongoose.model("Product", productSchema);
