const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");
const { type } = require("os");

const productSchema = mongoose.Schema({
  // step 1

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
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "venderId",
  },
  createdByAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "adminId",
  },

  // Step 2
  minOrderQuantity: {
    type: String,
    // required: true,
  },
  maxOrderQuantity: {
    type: String,
    // required: true,
  },
  warrantyPeriod: {
    type: String,
    // required: true,
  },
  guaranteePeriod: {
    type: String,
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
  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Brand",
    // required: true,
  },
  zipcodeId: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Zipcode",
    },
  ],
  isProductReturnable: {
    type: Boolean,
    default: false,
  },
  isCodAllowed: {
    type: Boolean,
    default: false,
  },
  isProductTaxIncluded: {
    type: Boolean,
    default: false,
  },
  isProductCancelable: {
    type: Boolean,
    default: false,
  },
  productVideoUrl: {
    type: String,
  },
  description: { type: String },
  price: { type: Number },
  discountedPrice: { type: Number },
  // step 3

  productHeroImage: {
    type: String,
  },
  productGallery: {
    type: [String],
    // required: true,
  },
  productVideo: {
    type: String,
  },

  // step 4 attributes

  productOtherDetails: [
    {
      key: { type: String },
      value: { type: String },
    },
  ],
  // admin action
  isActive: {
    type: Boolean,
    default: false,
  },
  // user action
  rating: {
    type: String,
  },
});

productSchema.plugin(timestamps);
module.exports = mongoose.model("Product", productSchema);
