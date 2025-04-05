const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");
const { type } = require("os");

const productSchema = mongoose.Schema({
  name: {
    type: String,
    // required: true,
  },
  tags: {
    type: [String],
    // required: true,
  },
  productType: {
    type: String,
    // required: true,
  },
  tax: {
    type: String,
    // required: true,
  },
  madeIn: {
    type: String,
    // required: true,
  },
  hsnCode: {
    type: String,
    // required: true,
  },
  shortDescription: {
    type: String,
    // required: true,
  },
  productHeroImage: {
    type: [String],
  },
  productGallery: {
    type: [String],
    // required: true,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    // required: true,
  },
  subCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubCategory",
    // required: true,
  },
  stockQuantity: {
    type: Number,
    // required: true,
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
  rating: {
    type: String,
  },
  createdBY: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "venderId",
    // required: true,
  },
});

productSchema.plugin(timestamps);
module.exports = mongoose.model("Product", productSchema);
