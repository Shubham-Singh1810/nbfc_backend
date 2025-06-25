const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const Coupon = require("../model/coupon.Schema");
const couponController = express.Router();
require("dotenv").config();
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");

couponController.post(
  "/create",
  upload.single("image"),
  async (req, res) => {
    try {
      let obj;
      if (req.file) {
        let image = await cloudinary.uploader.upload(
          req.file.path,
          function (err, result) {
            if (err) {
              return err;
            } else {
              return result;
            }
          }
        );
        obj = { ...req.body, image: image.url };
      }
      const couponCreated = await Coupon.create(obj);
      sendResponse(res, 200, "Success", {
        message: "Coupon created successfully!",
        data: couponCreated,
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
      const totalCount = await Coupon.countDocuments({});
          const activeCount = await Coupon.countDocuments({ status: "active" });
          const inactiveCount = await Coupon.countDocuments({ status: "inactive" });
    sendResponse(res, 200, "Success", {
      message: "Coupon list retrieved successfully!",
       documentCount: { totalCount, activeCount, inactiveCount: inactiveCount, expiredCount : totalCount -(activeCount+inactiveCount)  },
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
