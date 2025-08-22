const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const Loan = require("../model/loan.Schema");
const loanController = express.Router();
require("dotenv").config();
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");
const auth = require("../utils/auth");

loanController.post("/create", async (req, res) => {
  try {
    const addressCreated = await Loan.create(req.body);
    sendResponse(res, 200, "Success", {
      message: "Loan created successfully!",
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
loanController.post("/list", async (req, res) => {
  try {
    const {
      searchKey = "",
      status,
      pageNo = 1,
      pageCount = 10,
      sortByField,
      sortByOrder,
      userId,
    } = req.body;

    const query = {};
    if (status) query.status = status;
    if (searchKey) query.name = { $regex: searchKey, $options: "i" };
    if (userId) query.userId = userId;

    // Construct sorting object
    const sortField = sortByField || "createdAt";
    const sortOrder = sortByOrder === "asc" ? 1 : -1;
    const sortOption = { [sortField]: sortOrder };

    // Fetch the category list
    const loanTypeList = await Loan.find(query)
      .sort(sortOption)
      .limit(parseInt(pageCount))
      .skip(parseInt(pageNo - 1) * parseInt(pageCount))
    const totalCount = await Loan.countDocuments({});
    const activeCount = await Loan.countDocuments({ status: "active" });
    sendResponse(res, 200, "Success", {
      message: "Loan Type list retrieved successfully!",
      data: loanTypeList,
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


module.exports = loanController;
