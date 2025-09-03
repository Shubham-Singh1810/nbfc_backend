const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const Branch = require("../model/branch.Schema");
const branchController = express.Router();
require("dotenv").config();
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");
const auth = require("../utils/auth");

branchController.post("/create", async (req, res) => {
  try {
    const addressCreated = await Branch.create(req.body);
    sendResponse(res, 200, "Success", {
      message: "Branch created successfully!",
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
branchController.post("/list", async (req, res) => {
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
    if (searchKey) {
      query.$or = [
        { name: { $regex: searchKey, $options: "i" } },
        { address: { $regex: searchKey, $options: "i" } },
        { city: { $regex: searchKey, $options: "i" } },
        { state: { $regex: searchKey, $options: "i" } },
        { pincode: { $regex: searchKey, $options: "i" } },
        { phone: { $regex: searchKey, $options: "i" } },
      ];
    }

    // Sorting
    const sortField = sortByField || "createdAt";
    const sortOrder = sortByOrder === "asc" ? 1 : -1;
    const sortOption = { [sortField]: sortOrder };

    // Pagination
    const branchList = await Branch.find(query)
      .populate({
        path: "contactPersonId",
        select: "firstName lastName profilePic phone",
      })
      .sort(sortOption)
      .limit(parseInt(pageCount))
      .skip((parseInt(pageNo) - 1) * parseInt(pageCount));

    const totalCount = await Branch.countDocuments({});
    const activeCount = await Branch.countDocuments({ status: true });
    const inactiveCount = await Branch.countDocuments({ status: false });

    sendResponse(res, 200, "Success", {
      message: "Branch list retrieved successfully!",
      data: branchList,
      documentCount: {
        totalCount,
        activeCount,
        inactiveCount,
        pageNo,
        pageCount,
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
branchController.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const branchItem = await Branch.findById(id);
    if (!branchItem) {
      return sendResponse(res, 404, "Failed", {
        message: "Branch not found",
      });
    }
    // Delete the address from the database
    await Branch.findByIdAndDelete(id);

    sendResponse(res, 200, "Success", {
      message: "Branch deleted successfully!",
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});
branchController.put("/update", async (req, res) => {
  try {
    const id = req.body._id;

    // Find the category by ID
    const branchData = await Branch.findById(id);
    if (!branchData) {
      return sendResponse(res, 404, "Failed", {
        message: "Branch not found",
      });
    }

    let updatedData = { ...req.body };
    // Update the category in the database
    const updatedBranch = await Branch.findByIdAndUpdate(
      id,
      updatedData,
      {
        new: true, // Return the updated document
      }
    );
    sendResponse(res, 200, "Success", {
      message: "Branch updated successfully!",
      data: updatedBranch,
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});

module.exports = branchController;
