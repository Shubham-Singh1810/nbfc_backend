const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const Variant = require("../model/variant.Schema");
const variantController = express.Router();
require("dotenv").config();
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");
const auth = require("../utils/auth");
const fs = require("fs");
const path = require("path");


variantController.post("/add-variant", upload.single("variantImage"), async (req, res) => {
  try {
    const { id, variantKey, variantValue, variantPrice, variantDiscountedPrice, stockQuantity } = req.body;
    const product = await Product.findById(id);
    if (!product) {
      return sendResponse(res, 404, "Failed", {
        message: "Product not found",
        statusCode: 403
      });
    }

    let variantImage = "";
    if (req.file) {
      const uploaded = await cloudinary.uploader.upload(req.file.path);
      variantImage = uploaded.secure_url;
    }

    const variant = {
      variantKey,
      variantValue,
      variantPrice,
      variantDiscountedPrice,
      variantImage,
      stockQuantity
    };

    product.productVariants.push(variant);
    await product.save();

    sendResponse(res, 200, "Success", {
      message: "Variant added successfully!",
      data: product.productVariants,
      statusCode: 200
    });

  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
      statusCode: 500
    });
  }
});

variantController.put("/update-variant", upload.single("variantImage"), async (req, res) => {
  try {
    const { productId, variantIndex } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      return sendResponse(res, 404, "Failed", {
        message: "Product not found",
        statusCode: 404
      });
    }

    if (!product.productVariants[variantIndex]) {
      return sendResponse(res, 400, "Failed", {
        message: "Variant not found",
        statusCode: 400
      });
    }

    const variant = product.productVariants[variantIndex];

    const {
      variantKey = variant.variantKey,
      variantValue = variant.variantValue,
      variantPrice = variant.variantPrice,
      variantDiscountedPrice = variant.variantDiscountedPrice,
      stockQuantity = variant.stockQuantity,
    } = req.body;

    let variantImage = variant.variantImage;
    if (req.file) {
      const uploaded = await cloudinary.uploader.upload(req.file.path);
      variantImage = uploaded.secure_url;
    }

    // Update the variant
    product.productVariants[variantIndex] = {
      variantKey,
      variantValue,
      variantPrice,
      variantDiscountedPrice,
      variantImage,
      stockQuantity
    };

    await product.save();

    sendResponse(res, 200, "Success", {
      message: "Variant updated successfully!",
      data: product.productVariants[variantIndex],
      statusCode: 200
    });

  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
      statusCode: 500
    });
  }
});

variantController.put("/delete-variant", async (req, res) => {
  try {
    const { productId, variantIndex } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      return sendResponse(res, 404, "Failed", {
        message: "Product not found",
        statusCode: 404
      });
    }

    if (!product.productVariants[variantIndex]) {
      return sendResponse(res, 400, "Failed", {
        message: "Variant not found",
        statusCode: 400
      });
    }

    product.productVariants.splice(variantIndex, 1);
    await product.save();

    sendResponse(res, 200, "Success", {
      message: "Variant deleted successfully!",
      data: product.productVariants,
      statusCode: 200
    });

  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
      statusCode: 500
    });
  }
});

variantController.get("/list-variants/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId).select("productVariants");
    if (!product) {
      return sendResponse(res, 404, "Failed", {
        message: "Product not found",
        statusCode: 404
      });
    }

    sendResponse(res, 200, "Success", {
      message: "Variants fetched successfully!",
      data: product.productVariants,
      statusCode: 200
    });

  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
      statusCode: 500
    });
  }
});


module.exports = variantController;
