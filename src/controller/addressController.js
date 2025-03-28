const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const Address = require("../model/address.Schema");
const addressController = express.Router();
require("dotenv").config();
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");
const auth = require("../utils/auth");

addressController.post("/create", async (req, res) => {
  try {
    const addressCreated = await Address.create(req.body);
    sendResponse(res, 200, "Success", {
      message: "Address created successfully!",
      data: addressCreated,
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});

addressController.post("/list", async (req, res) => {
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
    const addressList = await Address.find(query)
      .sort(sortOption)
      .limit(parseInt(pageCount))
      .skip(parseInt(pageNo - 1) * parseInt(pageCount))
      .populate({
        path: "userId", // Field to populate
        select: "name description", // Specify the fields to retrieve from the category collection
      });
    const totalCount = await Address.countDocuments({});
    const activeCount = await Address.countDocuments({ status: true });
    sendResponse(res, 200, "Success", {
      message: "Address list retrieved successfully!",
      data: addressList,
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

addressController.put("/update", async (req, res) => {
  try {
    const id = req.body._id;

    // Find the category by ID
    const addressData = await Address.findById(id);
    if (!addressData) {
      return sendResponse(res, 404, "Failed", {
        message: "Address not found",
      });
    }

    let updatedData = { ...req.body };
    // Update the category in the database
    const updatedAddress = await Address.findByIdAndUpdate(
      id,
      updatedData,
      {
        new: true, // Return the updated document
      }
    );
    sendResponse(res, 200, "Success", {
      message: "Address updated successfully!",
      data: updatedAddress,
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});

addressController.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);
    const addressItem = await Address.findById(id);
    if (!addressItem) {
      return sendResponse(res, 404, "Failed", {
        message: "Address not found",
      });
    }
    // Delete the address from the database
    await Address.findByIdAndDelete(id);

    sendResponse(res, 200, "Success", {
      message: "Address deleted successfully!",
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});

module.exports = addressController;
