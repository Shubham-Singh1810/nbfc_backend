const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const orderVerificationController = express.Router();
const OrderVerification = require("../model/orderVerification.Schema");
const Booking = require("../model/booking.Schema");
require("dotenv").config();
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");
const { sendNotification } = require("../utils/sendNotification");
const { generateOTP } = require("../utils/common");

orderVerificationController.post(
  "/create",
  upload.single("image"),
  async (req, res) => {
    try {
      const orderDetails = await Booking.findOne({
        _id: req.body.orderId,
      }).populate({
        path: "userId",
        select: "name description phone",
      });
      if (!orderDetails) {
        return sendResponse(res, 422, "Failed", {
          message: "Order Id not found",
          statusCode: 404,
        });
      }
      let obj = req.body;
      if (req.file) {
        const image = await cloudinary.uploader.upload(req.file.path);
        obj.image = image.url;
      }
      // Generate OTP
      const phoneOtp = generateOTP();
      const orderVerificationCreated = await OrderVerification.create(obj);
      const appHash = "ems/3nG2V1H"; // Apne app ka actual hash yahan dalein

      // Properly formatted OTP message for autofill
      const otpMessage = `<#> ${phoneOtp} is your OTP for verification. Do not share it with anyone.\n${appHash}`;

      let optResponse = await axios.post(
        `https://api.authkey.io/request?authkey=${
          process.env.AUTHKEY_API_KEY
        }&mobile=${orderDetails?.userId?.phone}&country_code=91&sid=${
          process.env.AUTHKEY_SENDER_ID
        }&company=Acediva&otp=${phoneOtp}&message=${encodeURIComponent(
          otpMessage
        )}`
      );
      if (optResponse?.status == "200") {
        return sendResponse(res, 200, "Success", {
          message: "OTP send successfully",
          data: user,
          statusCode: 200,
        });
      } else {
        return sendResponse(res, 422, "Failed", {
          message: "Unable to send OTP",
          statusCode: 200,
        });
      }
    } catch (error) {
      console.error(error);
      sendResponse(res, 500, "Failed", {
        message: error.message || "Internal server error",
        statusCode: 500,
      });
    }
  }
);

orderVerificationController.put("/verify-otp", async (req, res) => {
  try {
    const id = req.body._id;
    const orderVerification = await OrderVerification.findOne({
      otp: req?.body?.otp,
      productId: req?.body?.productId,
      orderId: req?.body?.orderId
    });
    if (orderVerification) {
      const updatedOrderVerification =
        await OrderVerification.findByIdAndUpdate(id, {isOtpVerified:true}, {
          new: true, // Return the updated document
        });
      return sendResponse(res, 200, "Success", {
        message: "OTP Verified successfully",
        statusCode: 200,
      });
    }
    else{
     sendResponse(res, 404, "Failure", {
      message: "Wrong OTP",
      statusCode: 404,
    });
    }
  } catch (error) {
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
      statusCode: 500,
    });
  }
});

// orderVerificationController.post("/list", async (req, res) => {
//   try {
//     const {
//       category,
//       notifyUser,
//       isRead,
//       pageNo = 1,
//       pageCount = 10,
//     } = req.body;
//     const query = {};
//     if (category) {
//       query.category = category;
//     }
//     if (notifyUser) {
//       query.notifyUser = notifyUser;
//     }
//     if (isRead) {
//       query.isRead = isRead;
//     }
//     const notifyList = await Notify.find(query)

//       .limit(parseInt(pageCount))
//       .skip(parseInt(pageNo - 1) * parseInt(pageCount));

//     sendResponse(res, 200, "Success", {
//       message: "Notify list retrieved successfully!",
//       data: notifyList,
//       statusCode: 200,
//     });
//   } catch (error) {
//     console.error(error);
//     sendResponse(res, 500, "Failed", {
//       message: error.message || "Internal server error",
//       statusCode: 500,
//     });
//   }
// });

// orderVerificationController.put("/update", async (req, res) => {
//   try {
//     const id = req.body._id;
//     const notify = await Notify.findById(id);
//     if (!notify) {
//       return sendResponse(res, 404, "Failed", {
//         message: "Notify not found",
//         statusCode: 403,
//       });
//     }
//     const updatedNotify = await Notify.findByIdAndUpdate(id, req.body, {
//       new: true, // Return the updated document
//     });
//     sendResponse(res, 200, "Success", {
//       message: "Mark as read!",
//       data: updatedNotify,
//       statusCode: 200,
//     });
//   } catch (error) {
//     sendResponse(res, 500, "Failed", {
//       message: error.message || "Internal server error",
//       statusCode: 500,
//     });
//   }
// });

module.exports = orderVerificationController;
