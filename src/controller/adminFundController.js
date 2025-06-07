const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const AdminFund = require("../model/adminFund.Schema");
const adminFundController = express.Router();
require("dotenv").config();
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");
const SubCategory = require("../model/subCategory.Schema");
const Product = require("../model/product.Schema")
const { sendNotification } = require("../utils/sendNotification");



const moment = require("moment");

// const moment = require("moment");

adminFundController.post("/details", async (req, res) => {
  try {
    const details = await AdminFund.findOne();

    if (!details) {
      return sendResponse(res, 404, "Failed", {
        message: "Admin Fund data not found",
        statusCode: 404
      });
    }

    const today = moment().format("YYYY-MM-DD");
    const startOfMonth = moment().startOf("month").format("YYYY-MM-DD");
    const endOfMonth = moment().endOf("month").format("YYYY-MM-DD");

    let todayEarnings = 0;
    let thisMonthEarnings = 0;

   details.transactionHistory.forEach((txn) => {
  const txnDate = moment(txn.date, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD");

  if (txnDate == today) {
    console.log("Today's txn:", txn.transactionType, txn.amount)
    if (txn.transactionType === "credit") {
      todayEarnings += Number(txn.amount || 0);
    } else if (txn.transactionType === "debit") {
      todayEarnings -= Number(txn.amount || 0);
    }
  }

  if (txnDate >= startOfMonth && txnDate <= endOfMonth) {
    if (txn.transactionType === "credit") {
      thisMonthEarnings += Number(txn.amount || 0);
    } else if (txn.transactionType === "debit") {
      thisMonthEarnings -= Number(txn.amount || 0);
    }
  }
});


    sendResponse(res, 200, "Success", {
      message: "Admin Fund details retrieved successfully!",
      data: {
        details,
        todayEarnings,
        thisMonthEarnings
      },
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






module.exports = adminFundController;