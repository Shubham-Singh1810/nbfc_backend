const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const Booking = require("../model/booking.Schema");
const bookingController = express.Router();
require("dotenv").config();
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");
const auth = require("../utils/auth");
const fs = require("fs");
const path = require("path");


bookingController.post("/create", async (req, res) => {
  try {
    const { userId, totalAmount, status, product,
       bookingQuantity, bookingPrice, modeOfPayment,
         paymentId, signature, orderId, addressId  } = req.body;

    // Validate required fields
    if (!userId) {
      return sendResponse(res, 400, "Failed", {
        message: "userId is required in the request body",
        statusCode: 400,
      });
    }

    if (!status) {
      return sendResponse(res, 400, "Failed", {
        message: "status is required in the request body",
        statusCode: 400,
      });
    }

    const bookingData = {
      userId,
      totalAmount,
      status,
      product,
      bookingQuantity,
      bookingPrice,
      modeOfPayment,
      paymentId,
      signature,
      orderId,
      addressId
    };

    const bookingCreated = await Booking.create(bookingData);

    sendResponse(res, 200, "Success", {
      message: "Booking created successfully!",
      data: bookingCreated,
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

bookingController.post("/list", async (req, res) => {
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

    // Fetch the booking list
    const bookingList = await Booking.find(query)
      .sort(sortOption)
      .limit(parseInt(pageCount))
      .skip(parseInt(pageNo - 1) * parseInt(pageCount))
      .populate({
        path: "product",
        select: "name description",
      });
    const totalCount = await Booking.countDocuments({});
    const activeCount = await Booking.countDocuments({ status: true });
    sendResponse(res, 200, "Success", {
      message: "Booking list retrieved successfully!",
      data: bookingList,
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

bookingController.get("/details/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const booking = await Booking.find({ userId: userId })
      .populate("product.productId")
      .populate("userId");

    if (booking.length > 0) {
      return sendResponse(res, 200, "Success", {
        message: "Booking details fetched successfully",
        data: booking,
        statusCode: 200,
      });
    } else {
      return sendResponse(res, 404, "Failed", {
        message: "No bookings found for this user",
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

bookingController.put("/update",async (req, res) => {
    try {
      const id = req.body.id;
      const venderData = await Vender.findById(id);
      if (!venderData) {
        return sendResponse(res, 404, "Failed", {
          message: "Vender not found",
        });
      }

      let updateData = { ...req.body }
      const updatedUserData = await Vender.findByIdAndUpdate(id, updateData, {
        new: true,
      });
      if(req.body.profileStatus=="reUploaded"){
        sendNotification({
          icon:updatedUserData.profilePic,
          title:`${updatedUserData.firstName} has re-uploaded the details`,
          subTitle:`${updatedUserData.firstName} has re-uploaded the details`,
          notifyUserId:"Admin",
          category:"Vender",
          subCategory:"Profile update",
          notifyUser:"Admin",
        }, req.io)
      }
         if(req.body.profileStatus=="rejected"){
                sendNotification({
                  icon:updatedUserData.profilePic,
                  title:`${updatedUserData.firstName} your details has been rejected`,
                  subTitle:`${updatedUserData.firstName} please go through the details once more`,
                  notifyUserId:updatedUserData._id,
                  category:"Vender",
                  subCategory:"Profile update",
                  notifyUser:"Vender",
                }, req.io)
              }
      if(req.body.profileStatus=="approved"){
        sendNotification({
          icon:updatedUserData.profilePic,
          title:`${updatedUserData.firstName} your profile has been approved`,
          subTitle:`${updatedUserData.firstName} congratulations!! your profile has been approved`,
          notifyUserId:updatedUserData._id,
          category:"Vender",
          subCategory:"Profile update",
          notifyUser:"Vender",
        }, req.io)
      }
      if(req.body.profileStatus=="storeDetailsCompleted"){
        sendNotification({
          icon:updatedUserData.profilePic,
          title:`${updatedUserData.firstName} your storeDetails has been Completed`,
          subTitle:`${updatedUserData.firstName} congratulations!! your storeDetails has been Completed`,
          notifyUserId:updatedUserData._id,
          category:"Vender",
          subCategory:"Profile update",
          notifyUser:"Vender",
        }, req.io)
      }
      sendResponse(res, 200, "Success", {
        message: "Vendor updated successfully!",
        data: updatedUserData,
        statusCode: 200,
      });
    } catch (error) {
      console.error(error);
      sendResponse(res, 500, "Failed", {
        message: error.message || "Internal server error.",
      });
    }
  }
);

module.exports = bookingController;
