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
const { json } = require("stream/consumers");


orderVerificationController.post("/create", upload.single("image"), async (req, res) => {
  try {
    const { productIdArr, orderId, driverId } = req.body;
    let productIds = JSON.parse(productIdArr);

    if (!orderId || !productIds || productIds.length === 0 || !driverId) {
      return sendResponse(res, 400, "Failed", {
        message: "Missing order ID, product IDs array, or driver ID.",
      });
    }

    // Validate order
    const orderDetails = await Booking.findOne({ _id: orderId }).populate({
      path: "userId",
      select: "name description phone",
    });

    if (!orderDetails) {
      return sendResponse(res, 404, "Failed", {
        message: "Order ID not found",
        statusCode: 404,
      });
    }

    // Upload image
    let imageUrl = null;
    if (req.file) {
      const image = await cloudinary.uploader.upload(req.file.path);
      imageUrl = image.url;
    }

    // Generate OTP
    const phoneOtp = generateOTP();
    const appHash = "ems/3nG2V1H";
    const otpMessage = `<#> ${phoneOtp} is your OTP for verification. Do not share it with anyone.\n${appHash}`;

    // Create entries for each productId
    const createdEntries = await Promise.all(
      productIds.map((productId) =>
        OrderVerification.create({
          productId,
          orderId,
          driverId,
          image: imageUrl,
          otp: phoneOtp,
        })
      )
    );

    // Send OTP
    const otpResponse = await axios.post(
      `https://api.authkey.io/request?authkey=${process.env.AUTHKEY_API_KEY}&mobile=${orderDetails?.userId?.phone}&country_code=91&sid=${process.env.AUTHKEY_SENDER_ID}&company=Acediva&otp=${phoneOtp}&message=${encodeURIComponent(otpMessage)}`
    );

    if (otpResponse?.status === 200 || otpResponse?.data?.type === "success") {
      return sendResponse(res, 200, "Success", {
        message: "OTP sent successfully",
        data: createdEntries,
        statusCode: 200,
      });
    } else {
      return sendResponse(res, 422, "Failed", {
        message: "Unable to send OTP",
        statusCode: 422,
      });
    }
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
      statusCode: 500,
    });
  }
});


orderVerificationController.put("/verify-otp", async (req, res) => {
  try {
    const { productIdArr, orderId, otp } = req.body;
console.log(req.body)
    // Parse and validate productIds
    let productIds =  (productIdArr);

    if (!orderId || !productIds || productIds.length === 0 || !otp) {
      return sendResponse(res, 400, "Failed", {
        message: "Missing order ID, product IDs array, or OTP.",
      });
    }

    // Track updated documents
    const updatedEntries = await Promise.all(
      productIds.map(async (productId) => {
        const order = await OrderVerification.findOne({
          otp,
          productId,
          orderId,
        });

        if (order) {
          await Booking.findOneAndUpdate(
                {
                  _id: orderId,
                  "product.productId": productId,
                },
                {
                  $set: {
                    "product.$.deliveryStatus": "completed",
                  },
                },
                { new: true }
              );
          return await OrderVerification.findByIdAndUpdate(
            order._id,
            { isOtpVerified: true },
            { new: true }
          );
        }

        return null;
      })
    );

    const verifiedCount = updatedEntries.filter((entry) => entry !== null).length;

    if (verifiedCount > 0) {
      return sendResponse(res, 200, "Success", {
        message: `OTP verified successfully for ${verifiedCount} product(s).`,
        data: updatedEntries.filter(Boolean),
        statusCode: 200,
      });
    } else {
      return sendResponse(res, 404, "Failed", {
        message: "Invalid OTP or no matching product entries found.",
        statusCode: 404,
      });
    }
  } catch (error) {
    console.error("OTP verification failed:", error);
    return sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
      statusCode: 500,
    });
  }
});


module.exports = orderVerificationController;
