const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const Product = require("../model/product.Schema");
const productController = express.Router();
require("dotenv").config();
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");
const auth = require("../utils/auth");

productController.post("/create", async (req, res) => {
  try {
    const productCreated = await Product.create(req.body);
    sendResponse(res, 200, "Success", {
      message: "product created successfully!",
      data: productCreated,
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
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
        path: "categoryId", // Field to populate
        select: "name description", // Specify the fields to retrieve from the category collection
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

productController.put("/update", async (req, res) => {
  try {
    const id = req.body._id;

    // Find the category by ID
    const productData = await Product.findById(id);
    if (!productData) {
      return sendResponse(res, 404, "Failed", {
        message: "Product not found",
      });
    }

    let updatedData = { ...req.body };
    // Update the category in the database
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updatedData,
      {
        new: true, // Return the updated document
      }
    );
    sendResponse(res, 200, "Success", {
      message: "Product updated successfully!",
      data: updatedProduct,
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});

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
        const id = req.params.id
      const product = await Product.findOne({_id:id});
      if(product){
        return sendResponse(res, 200, "Success", {
            message: "Product details fetched  successfully",
            data: product,
            statusCode: 200,
          });
      }else{
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

module.exports = productController;
