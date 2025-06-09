const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const WithdrawRequest = require("../model/withdrawRequest.Schema");
const withdrawRequestController = express.Router();
require("dotenv").config();
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");

withdrawRequestController.post("/create", async (req, res) => {
  try {
    const withdrawRequestCreated = await WithdrawRequest.create(req.body);
    sendResponse(res, 200, "Success", {
      message: "withdrawRequest created successfully!",
      data: withdrawRequestCreated,
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

withdrawRequestController.post("/list", async (req, res) => {
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
    const sortField = sortByField || "createdAt";
    const sortOrder = sortByOrder === "asc" ? 1 : -1;
    const sortOption = { [sortField]: sortOrder };
    const zipcodeList = await Zipcode.find(query)
      .sort(sortOption)
      .limit(parseInt(pageCount))
      .skip(parseInt(pageNo - 1) * parseInt(pageCount));
    const totalCount = await Zipcode.countDocuments({});
    const activeCount = await Zipcode.countDocuments({ status: true });
    sendResponse(res, 200, "Success", {
      message: "Zipcode retrieved successfully!",
      data: zipcodeList,
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
      statusCode: 500,
    });
  }
});

withdrawRequestController.put("/update", async (req, res) => {
  try {
    const id = req.body._id;
    const zipcode = await Zipcode.findById(id);
    if (!zipcode) {
      return sendResponse(res, 404, "Failed", {
        message: "Zipcode not found",
        statusCode: 403,
      });
    }
    const updatedZipcode = await Zipcode.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true, // Return the updated document
      }
    );
    sendResponse(res, 200, "Success", {
      message: "Zipcode updated successfully!",
      data: updatedZipcode,
      statusCode: 200,
    });
  } catch (error) {
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
      statusCode: 500,
    });
  }
});

withdrawRequestController.get("/details/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const zipcodeDetails = await Zipcode.findOne({ _id: id });
    sendResponse(res, 200, "Success", {
      message: "Zipcode retrived successfully!",
      data: { zipcodeDetails },
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

module.exports = withdrawRequestController;