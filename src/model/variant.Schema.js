const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");

const variantSchema = mongoose.Schema({
   variants: [
    {
      variantKey: { type: String },
      variantValue: { type: String },
      variantPrice: { type: Number },
      variantDiscountedPrice: { type: Number },
      variantImage: { type: String },
      stockQuantity: { type: Number },
      variantHeroImage: { type: String },
      variantGallery: { type: [String] },
      productVariants: [
        {
          variantKey: { type: String },
          variantValue: { type: String },
          variantPrice: { type: Number },
          variantDiscountedPrice: { type: Number },
          variantImage: { type: String },
          stockQuantity: { type: Number },
          productId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Product"
            },
        },
      ],
    },
  ],
});

variantSchema.plugin(timestamps);
module.exports = mongoose.model("Variant", variantSchema);
