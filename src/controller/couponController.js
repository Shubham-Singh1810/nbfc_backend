const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const Coupon = require("../model/coupon.Schema");
const couponController = express.Router();
require("dotenv").config();
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");

couponController.post("/create", async (req, res) => {
  try {
    const couponCreated = await Coupon.create(req.body);
    sendResponse(res, 200, "Success", {
      message: "coupon created successfully!",
      data: couponCreated,
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

couponController.post("/list", async (req, res) => {
  try {
    const {
      pageNo = 1,
      pageCount = 10,
    } = req.body;
    const query = {};
    const couponList = await Coupon.find(query)
      .limit(parseInt(pageCount))
      .skip(parseInt(pageNo - 1) * parseInt(pageCount));
    sendResponse(res, 200, "Success", {
      message: "coupon list retrieved successfully!",
      data: couponList,
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

couponController.put("/update", async (req, res) => {
  try {
    const id = req.body._id;
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return sendResponse(res, 404, "Failed", {
        message: "Coupon not found",
        statusCode: 403,
      });
    }
    const updatedCoupon = await Coupon.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true, // Return the updated document
      }
    );
    sendResponse(res, 200, "Success", {
      message: "Coupon updated successfully!",
      data: updatedCoupon,
      statusCode: 200,
    });
  } catch (error) {
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
      statusCode: 500,
    });
  }
});

couponController.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return sendResponse(res, 404, "Failed", {
        message: "coupon not found",
        statusCode: 404,
      });
    }
    await Coupon.findByIdAndDelete(id);
    sendResponse(res, 200, "Success", {
      message: "coupon deleted successfully!",
      statusCode:200
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
      statusCode: 500,   
    });
  }
});

couponController.get("/details/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const couponDetails = await Coupon.findOne({ _id: id });
    sendResponse(res, 200, "Success", {
      message: "Coupon retrived successfully!",
      data: { couponDetails },
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

module.exports = couponController;
