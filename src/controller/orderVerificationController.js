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
const axios = require("axios");

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
      const orderVerificationCreated = await OrderVerification.create({...obj, otp:phoneOtp});
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
      // if (optResponse?.status == "200") {
      //   return sendResponse(res, 200, "Success", {
      //     message: "OTP send successfully",
      //     data: user,
      //     statusCode: 200,
      //   });
      // } 
      if (optResponse?.status == "200") {
        return sendResponse(res, 200, "Success", {
          message: "OTP sent successfully",
          statusCode: 200,
        });
      }
      
      else {
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


// orderVerificationController.post("/create", upload.single("image"), async (req, res) => {
//   try {
//     const { productIds, orderId, driverId } = req.body;

//     // Ensure productIds is a non-empty array
//     let parsedProductIds;
//     if (typeof productIds === "string") {
//       // If it's a JSON string, parse it
//       parsedProductIds = JSON.parse(productIds);
//     } else {
//       parsedProductIds = productIds;
//     }

//     if (!Array.isArray(parsedProductIds) || parsedProductIds.length === 0) {
//       return sendResponse(res, 400, "Failed", {
//         message: "productIds must be a non-empty array",
//         statusCode: 400,
//       });
//     }

//     // Validate order
//     const orderDetails = await Booking.findOne({ _id: orderId }).populate({
//       path: "userId",
//       select: "name description phone",
//     });

//     if (!orderDetails) {
//       return sendResponse(res, 404, "Failed", {
//         message: "Order Id not found",
//         statusCode: 404,
//       });
//     }

//     // Upload image
//     let imageUrl = null;
//     if (req.file) {
//       const image = await cloudinary.uploader.upload(req.file.path);
//       imageUrl = image.url;
//     }

//     // Generate OTP
//     const phoneOtp = generateOTP();
//     const appHash = "ems/3nG2V1H";
//     const otpMessage = `<#> ${phoneOtp} is your OTP for verification. Do not share it with anyone.\n${appHash}`;

//     // Create a single document with multiple productIds
//     const createdEntry = await OrderVerification.create({
//       productIds: parsedProductIds,
//       orderId,
//       driverId,
//       image: imageUrl,
//       otp: phoneOtp,
//     });

//     // Send OTP
//     const otpResponse = await axios.post(
//       `https://api.authkey.io/request?authkey=${process.env.AUTHKEY_API_KEY}&mobile=${orderDetails?.userId?.phone}&country_code=91&sid=${process.env.AUTHKEY_SENDER_ID}&company=Acediva&otp=${phoneOtp}&message=${encodeURIComponent(otpMessage)}`
//     );

//     if (otpResponse?.status === "200") {
//       return sendResponse(res, 200, "Success", {
//         message: "OTP sent successfully",
//         data: createdEntry,
//         statusCode: 200,
//       });
//     } else {
//       return sendResponse(res, 422, "Failed", {
//         message: "Unable to send OTP",
//         statusCode: 422,
//       });
//     }
//   } catch (error) {
//     console.error(error);
//     sendResponse(res, 500, "Failed", {
//       message: error.message || "Internal server error",
//       statusCode: 500,
//     });
//   }
// });



orderVerificationController.put("/verify-otp", async (req, res) => {
  try {
    const orderVerification = await OrderVerification.findOne({
      otp: req?.body?.otp,
      productId: req?.body?.productId,
      orderId: req?.body?.orderId
    });
    if (orderVerification) {
      const updatedOrderVerification =
        await OrderVerification.findByIdAndUpdate(orderVerification.id, {isOtpVerified:true}, {
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

module.exports = orderVerificationController;
