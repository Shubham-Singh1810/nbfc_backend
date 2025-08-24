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
loanController.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const loanTypeItem = await Loan.findById(id);
    if (!loanTypeItem) {
      return sendResponse(res, 404, "Failed", {
        message: "Loan type not found",
      });
    }
    await Loan.findByIdAndDelete(id);

    sendResponse(res, 200, "Success", {
      message: "Loan deleted successfully!",
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});
loanController.get("/details/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const loanType = await Loan.findOne({ _id: id }) 
    if (loanType) {
      return sendResponse(res, 200, "Success", {
        message: "Loan type details fetched  successfully",
        data: loanType,
        statusCode: 200,
      });
    } else {
      return sendResponse(res, 404, "Failed", {
        message: "Loan type not found",
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
loanController.put("/update", async (req, res) => {
  try {
    const id = req.body._id;

    // Find the category by ID
    const loanData = await Loan.findById(id);
    if (!loanData) {
      return sendResponse(res, 404, "Failed", {
        message: "Loan Type not found",
      });
    }

    let updatedData = { ...req.body };
    // Update the category in the database
    const updatedLoan = await Loan.findByIdAndUpdate(
      id,
      updatedData,
      {
        new: true, // Return the updated document
      }
    );
    sendResponse(res, 200, "Success", {
      message: "Loan type updated successfully!",
      data: updatedLoan,
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
