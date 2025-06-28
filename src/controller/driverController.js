const express = require("express");
const { sendResponse, generateOTP } = require("../utils/common");
require("dotenv").config();
const Driver = require("../model/driver.Schema");
const Booking = require("../model/booking.Schema");
const Admin = require("../model/admin.Schema");
const driverController = express.Router();
const axios = require("axios");
const moment = require("moment");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");
const { sendNotification } = require("../utils/sendNotification");
const auth = require("../utils/auth");
const mongoose = require("mongoose");

driverController.post(
  "/sign-up",
  upload.fields([
    { name: "dlFrontImage", maxCount: 1 },
    { name: "dlBackImage", maxCount: 1 },
    { name: "profilePic", maxCount: 1 },
    { name: "vehicleImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      // Check if the phone number is unique
      const user = await Driver.findOne({ phone: req.body.phone });
      if (user) {
        return sendResponse(res, 400, "Failed", {
          message: "Driver is already registered.",
          statusCode: 400,
        });
      }

      // Generate OTP
      const otp = generateOTP();

      // Upload images to Cloudinary
      let dlFrontImage, dlBackImage, profilePic;

      if (req.files["dlFrontImage"]) {
        let image = await cloudinary.uploader.upload(
          req.files["dlFrontImage"][0].path
        );
        dlFrontImage = image.url;
      }

      if (req.files["dlBackImage"]) {
        let image = await cloudinary.uploader.upload(
          req.files["dlBackImage"][0].path
        );
        dlBackImage = image.url;
      }
      if (req.files["profilePic"]) {
        let image = await cloudinary.uploader.upload(
          req.files["profilePic"][0].path
        );
        profilePic = image.url;
      }
      if (req.files["vehicleImage"]) {
        let image = await cloudinary.uploader.upload(
          req.files["vehicleImage"][0].path
        );
        vehicleImage = image.url;
      }

      // Create a new user with provided details
      let newDriver = await Driver.create({
        ...req.body,
        phoneOtp: otp,
        dlFrontImage,
        dlBackImage,
        vehicleImage,
        profilePic,
      });
      const superAdmin = await Admin.findOne({
        role: "680e3c4dd3f86cb24e34f6a6",
      });
      sendNotification({
        icon: newDriver.profilePic,
        title: "Driver registered",
        subTitle: `${newDriver.firstName} has registered to the portal`,
        notifyUserId: "Admin",
        category: "Driver",
        subCategory: "Registration",
        notifyUser: "Admin",
        fcmToken: superAdmin.deviceId,
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: newDriver._id, phone: newDriver.phone },
        process.env.JWT_KEY
      );

      // Store the token in the user object or return it in the response
      newDriver.token = token;
      const updatedDriver = await Driver.findByIdAndUpdate(
        newDriver._id,
        { token },
        { new: true }
      );

      // OTP message for autofill
      const appHash = "ems/3nG2V1H"; // Replace with your actual hash
      const otpMessage = `<#> ${otp} is your OTP for verification. Do not share it with anyone.\n${appHash}`;

      let otpResponse = await axios.post(
        `https://api.authkey.io/request?authkey=${
          process.env.AUTHKEY_API_KEY
        }&mobile=${req.body.phone}&country_code=91&sid=${
          process.env.AUTHKEY_SENDER_ID
        }&company=Acediva&otp=${otp}&message=${encodeURIComponent(otpMessage)}`
      );
      const io = req.io;
      io.emit("new-driver-registered", updatedDriver);
      if (otpResponse?.status == "200") {
        return sendResponse(res, 200, "Success", {
          message: "OTP sent successfully",
          data: updatedDriver,
          statusCode: 200,
        });
      } else {
        return sendResponse(res, 422, "Failed", {
          message: "Unable to send OTP",
          statusCode: 200,
        });
      }
    } catch (error) {
      console.error("Error in /sign-up:", error.message);
      return sendResponse(res, 500, "Failed", {
        message: error.message || "Internal server error.",
      });
    }
  }
);

driverController.post("/otp-verification", async (req, res) => {
  try {
    const { phone, phoneOtp, isforgetPassword } = req.body;

    const user = await Driver.findOne({ phone, phoneOtp });
    if (user) {
      const updatedFields = {
        isPhoneVerified: true,
      };

      if (!isforgetPassword) {
        updatedFields.profileStatus = "completed";
      }

      const updatedDriver = await Driver.findByIdAndUpdate(
        user._id,
        updatedFields,
        { new: true }
      );
      const superAdmin = await Admin.findOne({
        role: "680e3c4dd3f86cb24e34f6a6",
      });
      sendNotification({
        icon: updatedDriver.profilePic,
        title: "OTP verified",
        subTitle: `${updatedDriver.firstName} has verified their phone number`,
        notifyUserId: "Admin",
        category: "Driver",
        subCategory: "Verification",
        notifyUser: "Admin",
        fcmToken: superAdmin.deviceId,
      });
      const io = req.io;
      io.emit("driver-updated", updatedDriver);
      return sendResponse(res, 200, "Success", {
        message: "Otp verified successfully",
        data: updatedDriver,
        statusCode: 200,
      });
    } else {
      return sendResponse(res, 422, "Failed", {
        message: "Wrong OTP",
        statusCode: 422,
      });
    }
  } catch (error) {
    return sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error.",
      statusCode: 500,
    });
  }
});

driverController.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;
    const user = await Driver.findOne({ phone, password });
    if (user) {
      return sendResponse(res, 200, "Success", {
        message: "Driver logged in successfully",
        data: user,
        statusCode: 200,
      });
    } else {
      return sendResponse(res, 422, "Failed", {
        message: "Invalid Credentials",
        statusCode: 422,
      });
    }
  } catch (error) {
    return sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error.",
      statusCode: 500,
    });
  }
});

driverController.post("/resend-otp", async (req, res) => {
  try {
    const { phone } = req.body;
    const user = await Driver.findOne({ phone });

    if (user) {
      const otp = generateOTP();
      const updatedDriver = await Driver.findByIdAndUpdate(
        user._id,
        { phoneOtp: otp },
        { new: true }
      );

      // OTP message for autofill
      const appHash = "ems/3nG2V1H"; // Replace with your actual hash
      const otpMessage = `<#> ${otp} is your OTP for verification. Do not share it with anyone.\n${appHash}`;

      let otpResponse = await axios.post(
        `https://api.authkey.io/request?authkey=${
          process.env.AUTHKEY_API_KEY
        }&mobile=${req.body.phone}&country_code=91&sid=${
          process.env.AUTHKEY_SENDER_ID
        }&company=Acediva&otp=${otp}&message=${encodeURIComponent(otpMessage)}`
      );

      if (otpResponse?.status == "200") {
        return sendResponse(res, 200, "Success", {
          message: "OTP sent successfully",
          data: updatedDriver,
          statusCode: 200,
        });
      } else {
        return sendResponse(res, 200, "Success", {
          message: "Unable to send OTP",
          data: updatedDriver,
          statusCode: 422,
        });
      }
    } else {
      return sendResponse(res, 200, "Success", {
        message: "Phone number is not registered",
        statusCode: 422,
      });
    }
  } catch (error) {
    return sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error.",
      statusCode: 500,
    });
  }
});

driverController.get("/details/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const driver = await Driver.findOne({ _id: id }).lean();

    if (!driver) {
      return sendResponse(res, 404, "Failed", {
        message: "Driver not found",
        statusCode: 404,
      });
    }
    const nonApprovedFields = Object.keys(driver).filter(
      (key) =>
        key.startsWith("is") &&
        key.endsWith("Approved") &&
        driver[key] === false
    );

    driver.nonApprovedFields = nonApprovedFields;

    return sendResponse(res, 200, "Success", {
      message: "Driver details fetched successfully",
      data: driver,
      statusCode: 200,
    });
  } catch (error) {
    return sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error.",
      statusCode: 500,
    });
  }
});

driverController.post("/list", async (req, res) => {
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
    if (status) query.profileStatus = status;
    if (searchKey) {
      query.$or = [
        { firstName: { $regex: searchKey, $options: "i" } },
        { lastName: { $regex: searchKey, $options: "i" } },
        { email: { $regex: searchKey, $options: "i" } },
      ];
    }
    const sortField = sortByField || "createdAt";
    const sortOrder = sortByOrder === "asc" ? 1 : -1;
    const sortOption = { [sortField]: sortOrder };
    const userList = await Driver.find(query)
      .sort(sortOption)
      .limit(parseInt(pageCount))
      .skip(parseInt(pageNo - 1) * parseInt(pageCount));
    const totalCount = await Driver.countDocuments({});
    const activeCount = await Driver.countDocuments({
      profileStatus: "approved",
    });
    sendResponse(res, 200, "Success", {
      message: "Driver list retrieved successfully!",
      data: userList,
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
      statusCode: 500,
    });
  }
});

driverController.post("/create", auth, async (req, res) => {
  try {
    const driver = await Driver.create(req.body);
    return sendResponse(res, 200, "Success", {
      message: "Driver created  successfully",
      data: driver,
      statusCode: 200,
    });
  } catch (error) {
    return sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error.",
      statusCode: 500,
    });
  }
});

driverController.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const driver = await Driver.findById(id);
    if (!driver) {
      return sendResponse(res, 404, "Failed", {
        message: "Driver not found",
      });
    }
    await Driver.findByIdAndDelete(id);
    sendResponse(res, 200, "Success", {
      message: "Driver deleted successfully!",
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});

driverController.put(
  "/update",
  upload.fields([
    { name: "dlFrontImage", maxCount: 1 },
    { name: "dlBackImage", maxCount: 1 },
    { name: "profilePic", maxCount: 1 },
    { name: "vehicleImage", maxCount: 1 },
    { name: "signature", maxCount: 1 },
    { name: "adharCard", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const id = req.body.id;
      const userData = await Driver.findById(id);
      if (!userData) {
        return sendResponse(res, 404, "Failed", {
          message: "Driver not found",
        });
      }
      let updateData = { ...req.body };
      if (req.file || req.files) {
        if (req.files["dlFrontImage"]) {
          let image = await cloudinary.uploader.upload(
            req.files["dlFrontImage"][0].path
          );
          updateData.dlFrontImage = image.url;
        }

        if (req.files["dlBackImage"]) {
          let image = await cloudinary.uploader.upload(
            req.files["dlBackImage"][0].path
          );
          updateData.dlBackImage = image.url;
        }

        if (req.files["profilePic"]) {
          let image = await cloudinary.uploader.upload(
            req.files["profilePic"][0].path
          );
          updateData.profilePic = image.url;
        }

        if (req.files["vehicleImage"]) {
          let image = await cloudinary.uploader.upload(
            req.files["vehicleImage"][0].path
          );
          updateData.vehicleImage = image.url;
        }

        if (req.files["adharCard"]) {
          let image = await cloudinary.uploader.upload(
            req.files["adharCard"][0].path
          );
          updateData.adharCard = image.url;
        }

        if (req.files["signature"]) {
          let image = await cloudinary.uploader.upload(
            req.files["signature"][0].path
          );
          updateData.signature = image.url;
        }

        const updatedUserData = await Driver.findByIdAndUpdate(id, updateData, {
          new: true,
        });
        const superAdmin = await Admin.findOne({
          role: "680e3c4dd3f86cb24e34f6a6",
        });
        if (req.body.profileStatus == "reUploaded") {
          sendNotification({
            icon: updatedUserData.profilePic,
            title: "Re Uploaded",
            subTitle: `${updatedUserData.firstName} has re-uploaded the details.`,
            notifyUserId: "Admin",
            category: "Driver",
            subCategory: "Profile update",
            notifyUser: "Admin",
            fcmToken: superAdmin.deviceId,
          });
        }
        if (req.body.profileStatus == "accountDetailsCompleted") {
          sendNotification({
            icon: updatedUserData.profilePic,
            title: "Account Details Stored",
            subTitle: `${updatedUserData.firstName} has uploaded the account details.`,
            notifyUserId: "Admin",
            category: "Driver",
            subCategory: "Profile update",
            notifyUser: "Admin",
            fcmToken: superAdmin.deviceId,
          });
        }
        if (req.body.profileStatus == "rejected") {
          sendNotification({
            icon: updatedUserData.profilePic,
            title: "Details rejected",
            subTitle: `${updatedUserData.firstName} please go through the detail once more.`,
            notifyUserId: updatedUserData._id,
            category: "Driver",
            subCategory: "Profile update",
            notifyUser: "Driver",
            fcmToken: superAdmin.deviceId,
          });
        }
        if (req.body.profileStatus == "approved") {
          sendNotification({
            icon: updatedUserData.profilePic,
            title: "Profile Approved",
            subTitle: `${updatedUserData.firstName} congratulations!! your profile has been approved.`,
            notifyUserId: updatedUserData._id,
            category: "Driver",
            subCategory: "Profile update",
            notifyUser: "Driver",
            fcmToken: superAdmin.deviceId,
          });
        }
        const io = req.io;
        io.emit("driver-updated", updatedUserData);
        sendResponse(res, 200, "Success", {
          message: "Driver updated successfully!",
          data: updatedUserData,
          statusCode: 200,
        });
      } else {
        const updatedUserData = await Driver.findByIdAndUpdate(id, updateData, {
          new: true,
        });
        const superAdmin = await Admin.findOne({
          role: "680e3c4dd3f86cb24e34f6a6",
        });
        if (req.body.profileStatus == "reUploaded") {
          sendNotification({
            icon: updatedUserData.profilePic,
            title: "Re Uploaded",
            subTitle: `${updatedUserData.firstName} has re-uploaded the details.`,
            notifyUserId: "Admin",
            category: "Driver",
            subCategory: "Profile update",
            notifyUser: "Admin",
            fcmToken: superAdmin.deviceId,
          });
        }
        if (req.body.profileStatus == "accountDetailsCompleted") {
          sendNotification({
            icon: updatedUserData.profilePic,
            title: "Account Details Stored",
            subTitle: `${updatedUserData.firstName} has uploaded the account details.`,
            notifyUserId: "Admin",
            category: "Driver",
            subCategory: "Profile update",
            notifyUser: "Admin",
            fcmToken: superAdmin.deviceId,
          });
        }
        if (req.body.profileStatus == "rejected") {
          sendNotification({
            icon: updatedUserData.profilePic,
            title: "Details rejected",
            subTitle: `${updatedUserData.firstName} please go through the detail once more.`,
            notifyUserId: updatedUserData._id,
            category: "Driver",
            subCategory: "Profile update",
            notifyUser: "Driver",
            fcmToken: superAdmin.deviceId,
          });
        }
        if (req.body.profileStatus == "approved") {
          sendNotification({
            icon: updatedUserData.profilePic,
            title: "Profile Approved",
            subTitle: `${updatedUserData.firstName} congratulations!! your profile has been approved.`,
            notifyUserId: updatedUserData._id,
            category: "Driver",
            subCategory: "Profile update",
            notifyUser: "Driver",
            fcmToken: superAdmin.deviceId,
          });
        }
        const io = req.io;
        io.emit("driver-updated", updatedUserData);
        sendResponse(res, 200, "Success", {
          message: "Driver updated successfully!",
          data: updatedUserData,
          statusCode: 200,
        });
      }
    } catch (error) {
      console.error(error);
      sendResponse(res, 500, "Failed", {
        message: error.message || "Internal server error",
      });
    }
  }
);

driverController.put("/assign-products", async (req, res) => {
  try {
    const { id, productIds, deliveryStatus, driverId, expectedDeliveryDate } =
      req.body;

    // Validate input
    if (
      !id ||
      !productIds ||
      !Array.isArray(productIds) ||
      productIds.length === 0 ||
      !deliveryStatus ||
      !driverId ||
      !expectedDeliveryDate
    ) {
      return sendResponse(res, 400, "Failed", {
        message:
          "Missing booking ID, product IDs array, delivery status, driver ID, or expected delivery date.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(driverId)) {
      return sendResponse(res, 400, "Failed", {
        message: "Invalid driver ID format.",
      });
    }

    const allowedStatuses = [
      "orderPlaced",
      "orderPacked",
      "driverAssigned",
      "driverAccepted",
      "pickedOrder",
      "completed",
      "cancelled",
    ];

    if (!allowedStatuses.includes(deliveryStatus)) {
      return sendResponse(res, 400, "Failed", {
        message: "Invalid delivery status provided.",
      });
    }

    const updatedBooking = await Booking.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          "product.$[elem].deliveryStatus": deliveryStatus,
          "product.$[elem].driverId": new mongoose.Types.ObjectId(driverId),
          "product.$[elem].expectedDeliveryDate": expectedDeliveryDate,
        },
      },
      {
        arrayFilters: [
          { "elem.productId": { $in: productIds.map((id) => id.toString()) } },
        ],
        new: true,
      }
    );

    if (!updatedBooking) {
      return sendResponse(res, 404, "Failed", {
        message: "Booking or products not found.",
      });
    }

    return sendResponse(res, 200, "Success", {
      message:
        "Driver assigned, expected delivery date, and delivery status updated successfully.",
      data: updatedBooking,
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error.",
    });
  }
});

driverController.get("/assigned-products/:driverId", async (req, res) => {
  try {
    const { driverId } = req.params;

    const orders = await Booking.find({ "product.driverId": driverId })
      .populate({
        path: "product.productId",
        populate: {
          path: "createdBy",
          model: "Vender",
        },
      })
      .populate("product.driverId")
      .populate({
        path: "userId",
        select: "-cartItems",
      })
      .populate("addressId");

    // Vendor-wise grouping
    const vendorWiseProductsMap = new Map();
    const userWiseProductsMap = new Map();

    orders.forEach((order) => {
      order.product.forEach((prod) => {
        const vendor = prod.productId.createdBy;
        const user = order.userId;

        if (vendor) {
          const vendorId = vendor._id.toString();

          if (!vendorWiseProductsMap.has(vendorId)) {
            vendorWiseProductsMap.set(vendorId, {
              vendor: vendor,
              products: [],
            });
          }

          vendorWiseProductsMap.get(vendorId).products.push({
            bookingId: order._id,
            product: prod.productId,
            driver: prod.driverId,
            quantity: prod.quantity,
            totalPrice: prod.totalPrice,
            deliveryStatus: prod.deliveryStatus,
            user: user,
            address: order.addressId,
            order: order,
          });
        }

        if (user) {
          const userId = user._id.toString();

          if (!userWiseProductsMap.has(userId)) {
            userWiseProductsMap.set(userId, {
              user: user,
              products: [],
            });
          }

          userWiseProductsMap.get(userId).products.push({
            bookingId: order._id,
            product: prod.productId,
            driver: prod.driverId,
            quantity: prod.quantity,
            totalPrice: prod.totalPrice,
            deliveryStatus: prod.deliveryStatus,
            vendor: vendor,
            address: order.addressId,
            order: order,
          });
        }
      });
    });

    const vendorWiseProducts = Array.from(vendorWiseProductsMap.values());
    const userWiseProducts = Array.from(userWiseProductsMap.values());

    return sendResponse(res, 200, "Success", {
      message: "Assigned products fetched successfully",
      vendorWiseProducts,
      userWiseProducts,
      statusCode: 200,
    });
  } catch (error) {
    console.log(error);
    return sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
      statusCode: 500,
    });
  }
});

driverController.get(
  "/assigned-products-user-wise/:driverId",
  async (req, res) => {
    try {
      const { driverId } = req.params;

      const orders = await Booking.find({
        "product.driverId": driverId,
        "product.deliveryStatus": "driverAssigned",
      })
        .populate({
          path: "product.productId",
          populate: {
            path: "createdBy",
            model: "Vender",
          },
        })
        .populate("product.driverId")
        .populate({
          path: "userId",
          select: "-cartItems",
        })
        .populate("addressId");

      const result = orders
        .map((order) => {
          // vendor wise grouping inside each booking
          const vendorMap = new Map();

          // order.product.forEach(prod => {
          //   if (
          //     prod.driverId &&
          //     prod.driverId._id.toString() === driverId &&
          //     prod.deliveryStatus === "driverAssigned"
          //   ) {
          //     const vendorId = prod.productId.createdBy._id.toString();

          //     if (!vendorMap.has(vendorId)) {
          //       vendorMap.set(vendorId, {
          //         vendorDetails: prod.productId.createdBy,
          //         products: [],
          //       });
          //     }

          //     vendorMap.get(vendorId).products.push(prod);
          //   }
          // });

          order.product.forEach((prod) => {
            if (
              prod.driverId &&
              prod.driverId._id.toString() === driverId &&
              prod.deliveryStatus === "driverAssigned"
            ) {
              const vendorId = prod.productId?.createdBy?._id?.toString();

              if (!vendorId) return; // skip if product or vendor is missing

              if (!vendorMap.has(vendorId)) {
                vendorMap.set(vendorId, {
                  vendorDetails: prod.productId.createdBy,
                  products: [],
                });
              }

              vendorMap.get(vendorId).products.push(prod);
            }
          });

          return {
            _id: order._id,
            userId: order.userId,
            addressId: order.addressId,
            vendorProducts: Array.from(vendorMap.values()),
            assignedAt: order.updatedAt,
          };
        })
        .filter((order) => order.vendorProducts.length > 0); // only orders with assigned products

      return sendResponse(res, 200, "Success", {
        message: "Assigned products fetched vendor-wise successfully",
        data: result,
        statusCode: 200,
      });
    } catch (error) {
      console.log(error);
      return sendResponse(res, 500, "Failed", {
        message: error.message || "Internal server error",
        statusCode: 500,
      });
    }
  }
);

driverController.post("/my-orders", async (req, res) => {
  try {
    const {
      deliveryStatus,
      pageNo = 1,
      pageCount = 10,
      sortByField,
      sortByOrder,
      driverId,
      expectedDeliveryDateFilter, // "today", "tomorrow", "upcoming"
    } = req.body;

    if (!driverId) {
      return sendResponse(res, 400, "Failed", {
        message: "driverId is required",
        statusCode: 400,
      });
    }

    if (Array.isArray(deliveryStatus)) {
      return sendResponse(res, 400, "Failed", {
        message: "Only one deliveryStatus is allowed",
        statusCode: 400,
      });
    }

    const query = {
      "product.driverId": driverId,
    };

    if (deliveryStatus) {
      query["product.deliveryStatus"] = deliveryStatus;
    }

    // Time boundaries
    const today = moment().startOf("day");
    const tomorrow = moment().add(1, "days").startOf("day");
    const dayAfterTomorrow = moment().add(2, "days").startOf("day");

    // Setup sorting
    const sortField = sortByField || "createdAt";
    const sortOrder = sortByOrder === "asc" ? 1 : -1;
    const sortOption = { [sortField]: sortOrder };

    const bookings = await Booking.find(query)
      .populate({
        path: "product.productId",
        populate: {
          path: "createdBy",
          model: "Vender",
          select: "firstName lastName address storeName profilePic",
        },
      })
      .populate("product.driverId")
      .populate({
        path: "userId",
        select: "firstName lastName phone cartItems ",
      })
      .populate("addressId")
      .sort(sortOption)
      .skip((pageNo - 1) * pageCount)
      .limit(pageCount);

    const result = bookings.map((order) => {
      const vendorMap = new Map();

      order.product?.forEach((prod) => {
        const prodDriverId = prod.driverId?._id?.toString();
        const prodVendorId = prod.productId?.createdBy?._id?.toString();

        if (
          prodDriverId === driverId &&
          prod.deliveryStatus === deliveryStatus &&
          prodVendorId
        ) {
          if (!vendorMap.has(prodVendorId)) {
            vendorMap.set(prodVendorId, {
              vendorDetails: prod.productId.createdBy,
              products: [],
            });
          }

          vendorMap.get(prodVendorId).products.push(prod);
        }
      });

      return {
        _id: order._id,
        userId: order.userId,
        addressId: order.addressId,
        vendorProducts: Array.from(vendorMap.values()),
        modeOfPayment: order.modeOfPayment,
        paymentId: order.paymentId,
        signature: order.signature,
        orderDate: order.createdAt,
        assignedAt: order.updatedAt,
        totalAmount: order.totalAmount,
      };
    });

    const filteredResult = result.filter((order) => {
      if (!order.vendorProducts.length) return false;

      // Flatten products
      const products = order.vendorProducts.flatMap((v) => v.products);

      const match = products.some((prod) => {
        const expectedDate = moment(prod.expectedDeliveryDate, "DD-MM-YYYY");

        if (expectedDeliveryDateFilter === "today") {
          return expectedDate.isSame(today, "day");
        } else if (expectedDeliveryDateFilter === "tomorrow") {
          return expectedDate.isSame(tomorrow, "day");
        } else if (expectedDeliveryDateFilter === "upcoming") {
          return expectedDate.isAfter(tomorrow, "day");
        }

        return true;
      });

      return match;
    });

    // return sendResponse(res, 200, "Success", {
    //   data: filteredResult,
    //   statusCode: 200,
    // });

    // Sort by assignedAt (descending = latest first)
    filteredResult.sort(
      (a, b) => new Date(b.assignedAt) - new Date(a.assignedAt)
    );

    return sendResponse(res, 200, "Success", {
      data: filteredResult,
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
      statusCode: 500,
    });
  }
});

driverController.post("/my-ongoing-orders", async (req, res) => {
  try {
    const {
      deliveryStatus = "pickedOrder", // default to pickedOrder
      pageNo = 1,
      pageCount = 10,
      sortByField,
      sortByOrder,
      driverId,
    } = req.body;

    if (!driverId) {
      return sendResponse(res, 400, "Failed", {
        message: "driverId is required",
        statusCode: 400,
      });
    }

    if (Array.isArray(deliveryStatus)) {
      return sendResponse(res, 400, "Failed", {
        message: "Only one deliveryStatus is allowed",
        statusCode: 400,
      });
    }

    const query = {
      "product.driverId": driverId,
    };

    // Sorting
    const sortField = sortByField || "createdAt";
    const sortOrder = sortByOrder === "asc" ? 1 : -1;
    const sortOption = { [sortField]: sortOrder };

    const bookings = await Booking.find(query)
      .populate({
        path: "product.productId",
        populate: {
          path: "createdBy",
          model: "Vender",
          select: "firstName lastName",
        },
      })
      .populate("product.driverId")
      .populate({ path: "userId", select: "-cartItems -wishListItems" })
      .populate("addressId")
      .sort(sortOption)
      .skip((pageNo - 1) * pageCount)
      .limit(pageCount);

    const result = bookings.map((order) => {
      const vendorMap = new Map();
      let includeBooking = false;

      order.product?.forEach((prod) => {
        const prodDriverId = prod.driverId?._id?.toString();
        const prodVendorId = prod.productId?.createdBy?._id?.toString();

        if (prodDriverId === driverId && prodVendorId) {
          if (prod.deliveryStatus === deliveryStatus) {
            includeBooking = true;
          }

          if (!vendorMap.has(prodVendorId)) {
            vendorMap.set(prodVendorId, {
              vendorDetails: prod.productId.createdBy,
              products: [],
            });
          }

          vendorMap.get(prodVendorId).products.push(prod);
        }
      });

      return {
        includeBooking,
        orderData: {
          _id: order._id,
          userId: order.userId,
          addressId: order.addressId,
          vendorProducts: Array.from(vendorMap.values()),
          modeOfPayment: order.modeOfPayment,
          paymentId: order.paymentId,
          signature: order.signature,
          orderDate: order.createdAt,
          assignedAt: order.updatedAt,
          totalAmount: order.totalAmount,
        },
      };
    });

    const filteredResult = result
      .filter(
        ({ includeBooking, orderData }) =>
          includeBooking && orderData.vendorProducts.length
      )
      .map(({ orderData }) => orderData);

    // return sendResponse(res, 200, "Success", {
    //   data: filteredResult,
    //   statusCode: 200,
    // });

    // Sort by assignedAt (latest first)
    filteredResult.sort(
      (a, b) => new Date(b.assignedAt) - new Date(a.assignedAt)
    );

    return sendResponse(res, 200, "Success", {
      data: filteredResult,
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
      statusCode: 500,
    });
  }
});

module.exports = driverController;
