const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const Product = require("../model/product.Schema");
const productController = express.Router();
require("dotenv").config();
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");
const auth = require("../utils/auth");
const fs = require("fs");
const path = require("path");

productController.post("/create", async (req, res) => {
  try {
    const productData = {
      ...req.body,
    };

    const productCreated = await Product.create(productData);
    sendResponse(res, 200, "Success", {
      message: "Product created successfully!",
      data: productCreated,
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
      statusCode: 500,
    });
  }
});

productController.post("/list", async (req, res) => {
  try {
    const {
      searchKey = "",
      status,
      pageNo = 1,
      pageCount = 10,
      sortByField,
      sortByOrder,
    } = req.body;

    const query = {};
    if (status) query.status = status;
    if (searchKey) query.name = { $regex: searchKey, $options: "i" };

    // Construct sorting object
    const sortField = sortByField || "createdAt";
    const sortOrder = sortByOrder === "asc" ? 1 : -1;
    const sortOption = { [sortField]: sortOrder };

    // Fetch the category list
    const productList = await Product.find(query)
      .sort(sortOption)
      .limit(parseInt(pageCount))
      .skip(parseInt(pageNo - 1) * parseInt(pageCount))
      .populate({
        path: "categoryId",
        select: "name description", 
      })
      .populate({
        path: "createdBy",
        select: "name", 
      });
    const totalCount = await Product.countDocuments({});
    const activeCount = await Product.countDocuments({ status: true });
    sendResponse(res, 200, "Success", {
      message: "Product list retrieved successfully!",
      data: productList,
      documentCount: {
        totalCount,
        activeCount,
        inactiveCount: totalCount - activeCount,
      },
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});

productController.put("/update", 
  async (req, res) => {
    try {
      const id = req.body.id;
      console.log(id)
      const productData = await Product.findOne({_id:id});
      if (!productData) {
        return sendResponse(res, 404, "Failed", {
          message: "Product not found",
        });
      }
      let updateData = { ...req.body };
      const updatedProductData = await Product.findByIdAndUpdate(
        id,
        updateData,
        {
          new: true,
        }
      );
      sendResponse(res, 200, "Success", {
        message: "Product updated successfully!",
        data: updatedProductData,
        statusCode: 200,
      });
      
    } catch (error) {
      console.error(error);
      sendResponse(res, 500, "Failed", {
        message: error.message || "Internal server error",
      });
    }
  }
);

productController.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);
    // Find the category by ID
    const productItem = await Product.findById(id);
    if (!productItem) {
      return sendResponse(res, 404, "Failed", {
        message: "Product not found",
      });
    }
    // Delete the category from the database
    await Product.findByIdAndDelete(id);

    sendResponse(res, 200, "Success", {
      message: "Product deleted successfully!",
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});

productController.get("/details/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Product.findOne({ _id: id })
    .populate("categoryId")
    .populate("subCategoryId")
     .populate("brandId")
    .populate("zipcodeId");
    const variantOptions = {};

    product.productVariants.forEach((variant) => {
      // Primary Variant Key & Value
      if (variant.variantKey) {
        if (!variantOptions[variant.variantKey]) {
          variantOptions[variant.variantKey] = new Set();
        }
        variantOptions[variant.variantKey].add(variant.variantValue);
      }
  
      // Secondary Variant Key & Value
      if (variant.variantSecondaryKey) {
        if (!variantOptions[variant.variantSecondaryKey]) {
          variantOptions[variant.variantSecondaryKey] = new Set();
        }
        variantOptions[variant.variantSecondaryKey].add(
          variant.variantSecondaryValue
        );
      }
    });
  
    // Convert Set to Array
    Object.keys(variantOptions).forEach((key) => {
      variantOptions[key] = [...variantOptions[key]];
    });
    if (product) {
      return sendResponse(res, 200, "Success", {
        message: "Product details fetched  successfully",
        data: {...product.toObject(), variantOptions},
        statusCode: 200,
      });
    } else {
      return sendResponse(res, 404, "Failed", {
        message: "Product not found",
        statusCode: 404,
      });
    }
  } catch (error) {
    return sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error.",
      statusCode: 500,
    });
  }
});

productController.put("/update/hero-image", upload.single("productHeroImage"), async (req, res) => {
  try {
    const id = req.body.id;
    const product = await Product.findById(id);
    if (!product) {
      return sendResponse(res, 404, "Failed", {
        message: "Product not found",
        statusCode: 403
      });
    }
    let updatedData = { ...req.body };
    if (req.file) {
      
      const productHeroImage = await cloudinary.uploader.upload(req.file.path);
      updatedData.productHeroImage = productHeroImage.url;
    }
    const updatedProduct = await Product.findByIdAndUpdate(id, updatedData, {
      new: true, 
    });
    sendResponse(res, 200, "Success", {
      message: "Product hero image updated successfully!",
      data: updatedProduct,
      statusCode: 200
    });
  } catch (error) {
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
      statusCode: 500
    });
  }
});

productController.put("/update/add-product-gallery", upload.array("images"), async (req, res) => {
  try {
    const id = req.body.id;

    const product = await Product.findById(id);
    if (!product) {
      return sendResponse(res, 404, "Failed", {
        message: "Product not found",
        statusCode: 403,
      });
    }

    if (!req.files || req.files.length === 0) {
      return sendResponse(res, 400, "Failed", {
        message: "At least one image file is required",
        statusCode: 400,
      });
    }

    // Upload all images to Cloudinary
    const uploadedUrls = [];
    for (const file of req.files) {
      const uploadedImage = await cloudinary.uploader.upload(file.path);
      uploadedUrls.push(uploadedImage.secure_url);
    }

    // Push all URLs into productGallery
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $push: { productGallery: { $each: uploadedUrls } } },
      { new: true }
    );

    sendResponse(res, 200, "Success", {
      message: "Product gallery images added successfully!",
      data: updatedProduct,
      statusCode: 200,
    });

  } catch (error) {
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
      statusCode: 500,
    });
  }
});

productController.post("/delete/product-gallery", async (req, res) => {
  try {
    const { id, index } = req.body;

    if (!id || index === undefined) {
      return sendResponse(res, 400, "Failed", {
        message: "Product ID and index are required",
        statusCode: 400,
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return sendResponse(res, 404, "Failed", {
        message: "Product not found",
        statusCode: 404,
      });
    }

    const gallery = product.productGallery;
    
    if (!gallery || index < 0 || index >= gallery.length) {
      return sendResponse(res, 400, "Failed", {
        message: "Invalid image index",
        statusCode: 400,
      });
    }

    const imageUrl = gallery[index];

    // Delete from Cloudinary if image is stored there
    const publicId = imageUrl.split("/").pop().split(".")[0];
    await cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        console.error("Cloudinary delete error:", error);
      } else {
        console.log("Image deleted from Cloudinary:", result);
      }
    });

    // Remove the image from productGallery
    gallery.splice(index, 1);
    product.productGallery = gallery;
    const updatedProduct = await product.save();

    sendResponse(res, 200, "Success", {
      message: "Gallery image deleted successfully",
      data: updatedProduct,
      statusCode: 200,
    });

  } catch (error) {
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal Server Error",
      statusCode: 500,
    });
  }
});

productController.put("/update-video", upload.single("productVideo"), async (req, res) => {
  try {
    const { id } = req.body;

    // Check if product exists
    const product = await Product.findById(id);
    if (!product) {
      return sendResponse(res, 404, "Failed", {
        message: "Product not found",
        statusCode: 404
      });
    }

    // Initialize updatedData
    let updatedData = {};

    // Check if video file is uploaded
    if (req.file) {
      // Validate file type
      if (!req.file.mimetype.startsWith("video/")) {
        // Clean up the uploaded file
        fs.unlinkSync(req.file.path);
        return sendResponse(res, 400, "Failed", {
          message: "Only video files are allowed",
          statusCode: 400
        });
      }

      // Upload to Cloudinary with resource_type set to "video"
      const productVideo = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "video"
      });

      // Set video URL in update
      updatedData.productVideo = productVideo.url;

      // Delete local file after upload
      fs.unlinkSync(req.file.path);
    }

    // Update the product
    const updatedProduct = await Product.findByIdAndUpdate(id, updatedData, {
      new: true
    });

    // Send success response
    sendResponse(res, 200, "Success", {
      message: "Product video updated successfully!",
      data: updatedProduct,
      statusCode: 200
    });

  } catch (error) {
    console.error("Update video error:", error.message);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
      statusCode: 500
    });
  }
});

productController.post("/add-variant", upload.array("variantImage"), async (req, res) => {
  try {
    const { id, variantKey, variantValue, variantPrice, variantDiscountedPrice, stockQuantity, variantSecondaryKey, variantSecondaryValue } = req.body;
    const product = await Product.findById(id);
    if (!product) {
      return sendResponse(res, 404, "Failed", {
        message: "Product not found",
        statusCode: 403
      });
    }

    if (!req.files || req.files.length === 0) {
      return sendResponse(res, 400, "Failed", {
        message: "At least one image file is required",
        statusCode: 400,
      });
    }

    // Upload all images to Cloudinary
    const uploadedUrls = [];
    for (const file of req.files) {
      const uploadedImage = await cloudinary.uploader.upload(file.path);
      uploadedUrls.push(uploadedImage.secure_url);
    }

  

    const variant = {
      variantKey,
      variantValue,
      variantPrice,
      variantDiscountedPrice,
      variantImage:uploadedUrls,
      stockQuantity,
      variantSecondaryKey,
      variantSecondaryValue
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

productController.put("/update-variant", async (req, res) => {
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

productController.put("/update-variant-image", upload.array("variantImage"), async (req, res) => {
  try {
    const {
      productId,
      variantKey,
      variantValue,
      variantSecondaryKey,
      variantSecondaryValue
    } = req.body;

    if (!req.files || req.files.length === 0) {
      return sendResponse(res, 400, "Failed", {
        message: "Please upload at least one image",
        statusCode: 400
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return sendResponse(res, 404, "Failed", {
        message: "Product not found",
        statusCode: 404
      });
    }

    // Upload new images to Cloudinary
    const uploadedUrls = [];
    for (const file of req.files) {
      const uploadedImage = await cloudinary.uploader.upload(file.path);
      uploadedUrls.push(uploadedImage.secure_url);
    }

    // Find and update the variant
    const variantToUpdate = product.productVariants.find(
      (variant) =>
        variant.variantKey === variantKey &&
        variant.variantValue === variantValue &&
        variant.variantSecondaryKey === variantSecondaryKey &&
        variant.variantSecondaryValue === variantSecondaryValue
    );

    if (!variantToUpdate) {
      return sendResponse(res, 404, "Failed", {
        message: "Variant not found",
        statusCode: 404
      });
    }

    variantToUpdate.variantImage = uploadedUrls;

    await product.save();

    sendResponse(res, 200, "Success", {
      message: "Variant image updated successfully",
      data: variantToUpdate,
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

productController.put("/delete-variant", async (req, res) => {
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

productController.post("/delete/variant-gallery", async (req, res) => {
  try {
    const { id, variantIndex, imageIndex } = req.body;

    if (!id || variantIndex || imageIndex  === undefined) {
      return sendResponse(res, 400, "Failed", {
        message: "Product ID, variantIndex and imageIndex are required",
        statusCode: 400,
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return sendResponse(res, 404, "Failed", {
        message: "Product not found",
        statusCode: 404,
      });
    }

    const variant = product.productVariants;
    
    if (!variant || variantIndex < 0 || variantIndex >= variant.length) {
      return sendResponse(res, 400, "Failed", {
        message: "Invalid variant index",
        statusCode: 400,
      });
    }

    const variantGallery = variant.variantImage;
    
    if (!variantGallery || imageIndex < 0 || imageIndex >= variantGallery.length) {
      return sendResponse(res, 400, "Failed", {
        message: "Invalid image index",
        statusCode: 400,
      });
    }

    const imageUrl = variantGallery[imageIndex];

    // Delete from Cloudinary if image is stored there
    const publicId = imageUrl.split("/").pop().split(".")[0];
    await cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        console.error("Cloudinary delete error:", error);
      } else {
        console.log("Image deleted from Cloudinary:", result);
      }
    });

    // Remove the image from productGallery
    variantGallery.splice(imageIndex, 1);
    variant.variantImage = variantGallery;
    product.productVariant = variant;
    const updatedProduct = await product.save();

    sendResponse(res, 200, "Success", {
      message: "product variant image deleted successfully",
      data: updatedProduct,
      statusCode: 200,
    });

  } catch (error) {
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal Server Error",
      statusCode: 500,
    });
  }
});

productController.get("/list-variants/:productId", async (req, res) => {
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

productController.put("/add-attribute", async (req, res) => {
  try {
    const { id, key, value } = req.body;
    const product = await Product.findById(id);
    if (!product) {
      return sendResponse(res, 404, "Failed", {
        message: "Product not found",
        statusCode: 403
      });
    }

    const attribute = {
      key,
      value
    };

    product.productOtherDetails.push(attribute);
    await product.save();

    sendResponse(res, 200, "Success", {
      message: "Attribute added successfully!",
      data: product.productOtherDetails,
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

productController.put("/delete-attribute", async (req, res) => {
  try {
    const { productId, attributeIndex } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      return sendResponse(res, 404, "Failed", {
        message: "Product not found",
        statusCode: 404
      });
    }

    if (!product.productOtherDetails[attributeIndex]) {
      return sendResponse(res, 400, "Failed", {
        message: "Attribute not found",
        statusCode: 400
      });
    }

    product.productOtherDetails.splice(attributeIndex, 1);
    await product.save();

    sendResponse(res, 200, "Success", {
      message: "Attribute deleted successfully!",
      data: product.productOtherDetails,
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

productController.post("/filter-list", async (req, res) => {
  try {
    const {
      searchKey = "",
      status,
      name,
      brandId,
      categoryId,
      subCategoryId,
      price,
      discountedPrice,
      rating,
      pageNo = 1,
      pageCount = 10,
      sortByField,
      sortByOrder,
    } = req.body;

    const query = {};
    if (status !== undefined) query.status = status;
    if (searchKey) query.name = { $regex: searchKey, $options: "i" };
    if (name) query.name = name;
    if (brandId) query.brandId = brandId;
    if (categoryId) query.categoryId = categoryId;
    if (subCategoryId) query.subCategoryId = subCategoryId;
    if (discountedPrice) query.discountedPrice = discountedPrice;
    if (price) query.price = price;
    if (rating) query.rating = rating;

    const sortField = sortByField || "createdAt";
    const sortOrder = sortByOrder === "asc" ? 1 : -1;
    const sortOption = { [sortField]: sortOrder };
    console.log(sortOption)

    const productList = await Product.find(query)
      .sort(sortOption)
      .limit(parseInt(pageCount))
      .skip(parseInt(pageNo - 1) * parseInt(pageCount))
      .populate({
        path: "categoryId",
        select: "name description",
      })
      .populate({
        path: "createdBy",
        select: "name",
      });

    const totalCount = await Product.countDocuments(query); // fixed
    const activeCount = await Product.countDocuments({ ...query, status: true }); // fixed

    sendResponse(res, 200, "Success", {
      message: "Product list retrieved successfully!",
      data: productList,
      documentCount: {
        totalCount,
        activeCount,
        inactiveCount: totalCount - activeCount,
      },
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});



module.exports = productController;
