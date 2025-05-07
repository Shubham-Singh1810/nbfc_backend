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
    ref: "Vender",
  },
  createdByAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
  },
  status:{
    type: String,
    default:"pending",
    enum:["pending", "rejected", "approved", "reUploaded"]
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
      value: [{ type: String }],
    },
  ],
  productVariants: [
    {
      variantKey: { type: String },
      variantValue: { type: String },
      variantPrice: { type: Number },
      variantDiscountedPrice: { type: Number },
      variantImage: { type: String },
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
  specialApperence: {
    type: String,
  },
  productReturnPeriod:{
    type: String,
  },


  // details for product verification
  isNameApproved: {
    type: Boolean,
    default: false,
  },
  isTagsApproved: {
    type: Boolean,
    default: false,
  },
  isProductTypeApproved: {
    type: Boolean,
    default: false,
  },
  isTaxApproved: {
    type: Boolean,
    default: false,
  },
  isMadeInApproved: {
    type: Boolean,
    default: false,
  },
  isHsnCodeApproved: {
    type: Boolean,
    default: false,
  },
  isShortDescriptionApproved: {
    type: Boolean,
    default: false,
  },
  isMinOrderQuantityApproved: {
    type: Boolean,
    default: false,
  },
  isMaxOrderQuantityApproved: {
    type: Boolean,
    default: false,
  },
  isWarrantyPeriodApproved: {
    type: Boolean,
    default: false,
  },
  isGuaranteePeriodApproved: {
    type: Boolean,
    default: false,
  },
  isCategoryIdApproved: {
    type: Boolean,
    default: false,
  },
  isSubCategoryIdApproved: {
    type: Boolean,
    default: false,
  },
  isStockQuantityApproved: {
    type: Boolean,
    default: false,
  },
  isBrandIdApproved: {
    type: Boolean,
    default: false,
  },
  isZipcodeIdApproved: {
    type: Boolean,
    default: false,
  },
  isProductVideoUrlApproved: {
    type: Boolean,
    default: false,
  },
  isDescriptionApproved: {
    type: Boolean,
    default: false,
  },
  isPriceApproved: {
    type: Boolean,
    default: false,
  },
  isDiscountedPriceApproved: {
    type: Boolean,
    default: false,
  },
  isProductHeroImageApproved: {
    type: Boolean,
    default: false,
  },
  isProductGalleryApproved: {
    type: Boolean,
    default: false,
  },
  isProductVideoApproved: {
    type: Boolean,
    default: false,
  },
  isProductReturnPeriodApproved: {
    type: Boolean,
    default: false,
  },
  isProductOtherDetailsApproved: {
    type: Boolean,
    default: false,
  },
  isProductVariantsApproved: {
    type: Boolean,
    default: false,
  },


  // reject reason
nameRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  tagsRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  productTypeRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  taxRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  madeInRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  hsnCodeRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  shortDescriptionRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  minOrderQuantityRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  maxOrderQuantityRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  warrantyPeriodRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  guaranteePeriodRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  categoryIdRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  subCategoryIdRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  stockQuantityRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  brandIdRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  zipcodeIdRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  productVideoUrlRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  descriptionRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  priceRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  discountedPriceRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  productHeroImageRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  productGalleryRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  productVideoRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  productReturnPeriodRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  productOtherDetailsRejectReason: {
    type: String,
    default: "waiting for approval",
  },
  productVariantsRejectReason: {
    type: String,
    default: "waiting for approval",
  },

});

productSchema.plugin(timestamps);
module.exports = mongoose.model("Product", productSchema);
