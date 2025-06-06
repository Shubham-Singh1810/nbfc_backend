const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const orderVerificationController = express.Router();
const OrderVerification = require("../model/orderVerification.Schema");
const AdminFund = require("../model/adminFund.Schema");
const Vender = require("../model/vender.Schema");
const Driver = require("../model/driver.Schema");
const Booking = require("../model/booking.Schema");
require("dotenv").config();
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");
const moment = require("moment");
const { sendNotification } = require("../utils/sendNotification");
const { generateOTP } = require("../utils/common");
const axios = require("axios");
const { json } = require("stream/consumers");

orderVerificationController.post(
  "/create",
  upload.single("image"),
  async (req, res) => {
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
        `https://api.authkey.io/request?authkey=${
          process.env.AUTHKEY_API_KEY
        }&mobile=${orderDetails?.userId?.phone}&country_code=91&sid=${
          process.env.AUTHKEY_SENDER_ID
        }&company=Acediva&otp=${phoneOtp}&message=${encodeURIComponent(
          otpMessage
        )}`
      );

      if (
        otpResponse?.status === 200 ||
        otpResponse?.data?.type === "success"
      ) {
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
  }
);

// orderVerificationController.put("/verify-otp", async (req, res) => {
//   try {
//     const { productIdArr, orderId, otp } = req.body;
//     // Parse and validate productIds
//     let productIds =  (productIdArr);

//     if (!orderId || !productIds || productIds.length === 0 || !otp) {
//       return sendResponse(res, 400, "Failed", {
//         message: "Missing order ID, product IDs array, or OTP.",
//       });
//     }

//     // Track updated documents
//     const updatedEntries = await Promise.all(
//       productIds.map(async (productId) => {
//         const order = await OrderVerification.findOne({
//           otp,
//           productId,
//           orderId,
//         });

//         if (order) {
//           await Booking.findOneAndUpdate(
//                 {
//                   _id: orderId,
//                   "product.productId": productId,
//                 },
//                 {
//                   $set: {
//                     "product.$.deliveryStatus": "completed",
//                   },
//                 },
//                 { new: true }
//               );
//           return await OrderVerification.findByIdAndUpdate(
//             order._id,
//             { isOtpVerified: true },
//             { new: true }
//           );
//         }

//         return null;
//       })
//     );

//     const verifiedCount = updatedEntries.filter((entry) => entry !== null).length;

//     if (verifiedCount > 0) {
//       return sendResponse(res, 200, "Success", {
//         message: `OTP verified successfully for ${verifiedCount} product(s).`,
//         data: updatedEntries.filter(Boolean),
//         statusCode: 200,
//       });
//     } else {
//       return sendResponse(res, 404, "Failed", {
//         message: "Invalid OTP or no matching product entries found.",
//         statusCode: 404,
//       });
//     }
//   } catch (error) {
//     console.error("OTP verification failed:", error);
//     return sendResponse(res, 500, "Failed", {
//       message: error.message || "Internal server error",
//       statusCode: 500,
//     });
//   }
// });

// orderVerificationController.put("/verify-otp", async (req, res) => {
//   try {
//     const { productIdArr, orderId, otp } = req.body;

//     if (!orderId || !productIdArr || productIdArr.length === 0 || !otp) {
//       return sendResponse(res, 400, "Failed", {
//         message: "Missing order ID, product IDs array, or OTP.",
//       });
//     }

//     const updatedEntries = await Promise.all(
//       productIdArr.map(async (productId) => {
//         const order = await OrderVerification.findOne({
//           otp,
//           productId,
//           orderId,
//         });

//         if (!order) return null;

//         // Step 1: Update Booking Product's delivery status
//         await Booking.findOneAndUpdate(
//           {
//             _id: orderId,
//             "product.productId": productId,
//           },
//           {
//             $set: {
//               "product.$.deliveryStatus": "completed",
//             },
//           },
//           { new: true }
//         );

//         // Step 2: Mark OTP as verified
//         await OrderVerification.findByIdAndUpdate(order._id, {
//           isOtpVerified: true,
//         });

//         // Step 3: Fund Distribution Logic
//         const booking = await Booking.findById(orderId).populate("product.productId");

//         const matchedProduct = booking.product.find(
//           (p) => String(p.productId._id) === String(productId)
//         );

//         if (!matchedProduct) return null;

//         const productInfo = matchedProduct.productId;
//         const price = parseFloat(matchedProduct.totalPrice || 0);

//         const vendorId = productInfo.createdBy;
//         const driverId = matchedProduct.driverId;

//         // 🟡 Fetch commission settings from AdminFund
//         const adminFund = await AdminFund.findOne();
//         if (!adminFund) return null;

//         const vendorPercentage = parseFloat(adminFund.venderCommision || 90); // default 90%
//         const driverPercentageOfAdmin = parseFloat(adminFund.driverCommision || 5); // default 3%

//         // 🧮 Calculate commission shares
//         const adminPercentage = 100 - vendorPercentage;

//         const vendorAmount = (price * vendorPercentage) / 100;
//         const adminAmount = (price * adminPercentage) / 100;
//         const driverAmount = (adminAmount * driverPercentageOfAdmin) / 100;
//         const adminFinalAmount = adminAmount - driverAmount;

//         // Update Admin Wallet
//         adminFund.wallet = (
//           parseFloat(adminFund.wallet || 0) + adminFinalAmount
//         ).toFixed(2);
//         adminFund.transactionHistory = adminFund.transactionHistory || [];
//         adminFund.transactionHistory.push({
//           message: `Admin received ₹${adminFinalAmount} after paying driver ₹${driverAmount} for product ${productId}`,
//           transactionType: "credit",
//           amount: adminFinalAmount,
//           date: moment().format("YYYY-MM-DD HH:mm:ss"),
//         });
//         await adminFund.save();

//         // Update Vendor Wallet
//         if (vendorId) {
//           const vendor = await Vender.findById(vendorId);
//           if (vendor) {
//             vendor.wallet = (
//               parseFloat(vendor.wallet || 0) + vendorAmount
//             ).toFixed(2);
//             vendor.transactionHistory = vendor.transactionHistory || [];
//             vendor.transactionHistory.push({
//               message: `Amount credited for delivered product ${productId}`,
//               transactionType: "credit",
//               amount: vendorAmount,
//               date: moment().format("YYYY-MM-DD HH:mm:ss"),
//             });
//             await vendor.save();
//           }
//         }

//         // Update Driver Wallet
//         if (driverId) {
//           const driver = await Driver.findById(driverId);
//           if (driver) {
//             driver.wallet = (
//               parseFloat(driver.wallet || 0) + driverAmount
//             ).toFixed(2);
//             driver.transactionHistory = driver.transactionHistory || [];
//             driver.transactionHistory.push({
//               message: `Amount credited from admin commission for delivery of product ${productId}`,
//               transactionType: "credit",
//               amount: driverAmount,
//               date: moment().format("YYYY-MM-DD HH:mm:ss"),
//             });
//             await driver.save();
//           }
//         }

//         return order;
//       })
//     );

//     const verifiedCount = updatedEntries.filter(Boolean).length;

//     if (verifiedCount > 0) {
//       return sendResponse(res, 200, "Success", {
//         message: `OTP verified and payment distributed for ${verifiedCount} product(s).`,
//         data: updatedEntries.filter(Boolean),
//         statusCode: 200,
//       });
//     } else {
//       return sendResponse(res, 404, "Failed", {
//         message: "Invalid OTP or no matching entries.",
//         statusCode: 404,
//       });
//     }
//   } catch (error) {
//     console.error("OTP verification failed:", error);
//     return sendResponse(res, 500, "Failed", {
//       message: error.message || "Internal server error",
//       statusCode: 500,
//     });
//   }
// });

orderVerificationController.put("/verify-otp", async (req, res) => {
  try {
    const { productIdArr, orderId, otp } = req.body;

    if (!orderId || !productIdArr || productIdArr.length === 0 || !otp) {
      return sendResponse(res, 400, "Failed", {
        message: "Missing order ID, product IDs array, or OTP.",
      });
    }
    let driverDetails ;
    const updatedEntries = await Promise.all(
      productIdArr.map(async (productId) => {
        const order = await OrderVerification.findOne({
          otp,
          productId,
          orderId,
        });
        if (!order) return null;

        await Booking.findOneAndUpdate(
          { _id: orderId, "product.productId": productId },
          { $set: { "product.$.deliveryStatus": "completed" } },
          { new: true }
        );

        await OrderVerification.findByIdAndUpdate(order._id, {
          isOtpVerified: true,
        });

        const booking = await Booking.findById(orderId).populate(
          "product.productId"
        );
        const matchedProduct = booking.product.find(
          (p) => String(p.productId._id) === String(productId)
        );
        if (!matchedProduct) return null;

        const productInfo = matchedProduct.productId;
        const price = parseFloat(matchedProduct.totalPrice || 0);

        const vendorId = productInfo.createdBy;
        const driverId = matchedProduct.driverId;
        driverDetails = await Driver.findOne({_id:driverId})

        const adminFund = await AdminFund.findOne();
        const venderDetails = await Vender.findOne({ _id: vendorId });
        if (!adminFund) return null;

        const vendorPercentage = parseFloat(
          venderDetails.venderCommision || adminFund.venderCommision
        );
        
        const adminPercentage = 100 - vendorPercentage;

        const vendorAmount = (price * vendorPercentage) / 100;
        const adminAmount = (price * adminPercentage) / 100;

        const adminWalletAmount = adminFund.wallet - vendorAmount;

        // Admin Wallet Update
        adminFund.wallet = adminWalletAmount;
        adminFund.totalEarnings = adminFund.totalEarnings - vendorAmount;
        adminFund.transactionHistory = adminFund.transactionHistory || [];
        adminFund.transactionHistory.push({
          message: `Admin shared ₹${vendorAmount.toFixed(
            2
          )} to vendor for order ID ${orderId}`,
          transactionType: "debit",
          date: moment().format("YYYY-MM-DD HH:mm:ss"),
        });
        await adminFund.save();

        // Vendor Wallet Update
        if (vendorId) {
          if (venderDetails) {
            venderDetails.wallet = (
              parseFloat(vendorAmount.wallet || 0) + vendorAmount
            ).toFixed(2);
            venderDetails.transactionHistory =
              vendorAmount.transactionHistory || [];
            venderDetails.totalEarnings =
              venderDetails.totalEarnings + vendorAmount;
            venderDetails.transactionHistory.push({
              message: `₹${vendorAmount.toFixed(
                2
              )} credited for delivered product ID ${productId}`,
              transactionType: "credit",
              amount: vendorAmount.toFixed(2),
              date: moment().format("YYYY-MM-DD HH:mm:ss"),
            });
            await venderDetails.save();
          }
        }

        return order;
      })
    );
    const adminFund = await AdminFund.findOne();
    const driverAmount =  adminFund?.driverCommission * 10

    driverDetails?.wallet = driverDetails?.wallet + driverAmount;
    driverDetails?.totalEarnings = driverDetails?.totalEarnings + driverAmount;
     driverDetails.transactionHistory.push({
              message: `₹${driverAmount.toFixed(
                2
              )} has been credited for delivering the order ID ${orderId}`,
              transactionType: "credit",
              
              date: moment().format("YYYY-MM-DD HH:mm:ss"),
            });
    await driverDetails.save();

    // Admin Wallet Update
        adminFund.wallet = adminFund?.wallet-driverAmount;
        adminFund.totalEarnings = adminFund.totalEarnings - driverAmount;
        adminFund.transactionHistory = adminFund.transactionHistory || [];
        adminFund.transactionHistory.push({
          message: `Admin shared ₹${driverAmount.toFixed(
            2
          )} to driver for order ID ${orderId}`,
          transactionType: "debit",
          date: moment().format("YYYY-MM-DD HH:mm:ss"),
        });
        await adminFund.save();
   
    const verifiedCount = updatedEntries.filter(Boolean).length;
    
    if (verifiedCount > 0) {
      return sendResponse(res, 200, "Success", {
        message: `OTP verified and payment distributed for ${verifiedCount} product(s).`,
        data: updatedEntries.filter(Boolean),
      });
    } else {
      return sendResponse(res, 404, "Failed", {
        message: "Invalid OTP or no matching entries.",
      });
    }
  } catch (error) {
    console.error("OTP verification failed:", error);
    return sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});

module.exports = orderVerificationController;
