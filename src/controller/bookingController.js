const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const Booking = require("../model/booking.Schema");
const Coupon = require("../model/coupon.Schema");
const AdminFund = require("../model/adminFund.Schema");
const User = require("../model/user.Schema");
const Vender = require("../model/vender.Schema");
const Product = require("../model/product.Schema");
const Address = require("../model/address.Schema");
const Driver = require("../model/driver.Schema");
const Admin = require("../model/admin.Schema");
const TransactionHistory = require("../model/transactionHistory.Schema");
const bookingController = express.Router();
require("dotenv").config();
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");
const moment = require("moment");
const auth = require("../utils/auth");
const geolib = require("geolib");
const fs = require("fs");
const path = require("path");
const { sendNotification } = require("../utils/sendNotification");

function haversine(coord1, coord2) {
  const toRad = (angle) => (Math.PI / 180) * angle;
  const R = 6371e3; // metres

  const φ1 = toRad(coord1.latitude);
  const φ2 = toRad(coord2.latitude);
  const Δφ = toRad(coord2.latitude - coord1.latitude);
  const Δλ = toRad(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}

function getOptimizedRoute(startLocation, vendorLocations, endLocation) {
  let remainingVendors = [...vendorLocations];
  let currentLocation = startLocation;
  let route = [];

  while (remainingVendors.length > 0) {
    let nearestVendor = remainingVendors.reduce((nearest, vendor) => {
      const distance = haversine(currentLocation, vendor);
      const nearestDistance = haversine(currentLocation, nearest);
      return distance < nearestDistance ? vendor : nearest;
    });

    route.push(nearestVendor);
    currentLocation = nearestVendor;
    remainingVendors = remainingVendors.filter(
      (v) => v.vendorId !== nearestVendor.vendorId
    );
  }

  // Lastly add user
  route.push(endLocation);

  return route;
}

bookingController.post("/create", async (req, res) => {
  try {
    const {
      userId,
      couponId,
      finalAmount,
      totalAmount,
      product,
      couponDiscountValue,
      bookingQuantity,
      modeOfPayment,
      paymentId,
      signature,
      orderId,
      addressId,
      deliveryCharges = 0,
    } = req.body;

    if (!userId) {
      return sendResponse(res, 400, "Failed", {
        message:  "User Id is required",
        statusCode: 400,
      });
    }

    const updatedProducts = product.map((item) => ({
      ...item,
      expectedDeliveryDate: moment().add(7, "days").format("DD-MM-YYYY"),
    }));

    if (couponId) {
      const coupon = await Coupon.findOne({  _id:couponId });

      if (!coupon) {
        return sendResponse(res, 400, "Failed", {
          message: "Invalid coupon code",
          statusCode: 400,
        });
      }

      const now = new Date();
 
      const isValid =
        coupon.status === "active" &&
        now >= new Date(coupon.validFrom) &&
        now <= new Date(coupon.validTo) &&
        totalAmount >= coupon.minimumOrderAmount;

      if (!isValid) {
        return sendResponse(res, 400, "Failed", {
          message: "Coupon is not valid at this time or order amount is too low.",
          statusCode: 400,
        });
      }
      if (coupon.usedCount == coupon.usageLimit) {
        return sendResponse(res, 400, "Failed", {
          message: "Coupon is not valid, reach the maximum use.",
          statusCode: 400,
        });
      }
      await Coupon.findByIdAndUpdate(couponId, { $set: { usedCount:coupon.usedCount + 1  } },
        { new: true })
    }

    const bookingData = {
      userId,
      totalAmount,
      finalAmount,
      couponId,
      couponDiscountValue,
      deliveryCharges,
      product: updatedProducts,
      bookingQuantity,
      modeOfPayment,
      paymentId,
      signature,
      orderId,
      addressId,
    };

    const bookingCreated = await Booking.create(bookingData);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { cartItems: [] } },
      { new: true }
    );

    const superAdmin = await Admin.findOne({
      role: "680e3c4dd3f86cb24e34f6a6",
    });

    if (modeOfPayment === "Online") {
      let adminFund = await AdminFund.findOne();
      const updatedWalletAmount = (
        parseFloat(adminFund.wallet || 0) + parseFloat(totalAmount)
      ).toFixed(2);

      const newTransaction = {
        message: `Order amount ₹${totalAmount} credited to admin wallet for user ${updatedUser.firstName}`,
        transactionType: "credit",
        date: moment().format("YYYY-MM-DD HH:mm:ss"),
        amount: totalAmount,
      };

      adminFund.wallet = updatedWalletAmount;
      adminFund.totalEarnings += parseFloat(totalAmount);
      adminFund.transactionHistory = adminFund.transactionHistory || [];
      adminFund.transactionHistory.push(newTransaction);
      await adminFund.save();

      if (superAdmin?.deviceId) {
        await sendNotification({
          title: "Wallet",
          subTitle: `You received ₹${totalAmount} for a new booking` ,
          icon: "https://cdn-icons-png.flaticon.com/128/6020/6020135.png",
          notifyUserId: "admin",
          category: "Wallet",
          subCategory: "Credit",
          notifyUser: "Admin",
          fcmToken: superAdmin.deviceId,
        });
      }
    }

    if (superAdmin?.deviceId) {
      await sendNotification({
        title: "New Order",
        subTitle: `${updatedUser?.firstName} has placed a new order.`,
        icon: updatedUser?.profilePic,
        notifyUserId: "admin",
        category: "Booking",
        subCategory: "New Order",
        notifyUser: "Admin",
        fcmToken: superAdmin.deviceId,
      });
    }

    if (updatedUser?.androidDeviceId) {
      await sendNotification({
        title: "Order Placed",
        subTitle: `Your order has been placed successfully.`,
        icon: "https://cdn-icons-png.flaticon.com/128/190/190411.png",
        notifyUserId: userId,
        category: "Booking",
        subCategory: "New Order",
        notifyUser: "User",
        fcmToken: updatedUser.androidDeviceId,
      });
    }

    const populatedBooking = await Booking.findById(bookingCreated._id).populate("product.productId");

    for (const item of populatedBooking.product) {
      const createdById = item.productId?.createdBy;
      if (!createdById) continue;

      const vendor = await Vender.findById(createdById);
      if (!vendor?.androidDeviceId) continue;

      await sendNotification({
        title: "New Order",
        subTitle: `${updatedUser?.firstName} has placed a new order.`,
        icon: updatedUser?.profilePic,
        notifyUserId: vendor._id,
        category: "Booking",
        subCategory: "New Order",
        notifyUser: "Vender",
        fcmToken: vendor.androidDeviceId,
      });
    }

    sendResponse(res, 200, "Success", {
      message: "Booking created successfully!",
      data: bookingCreated,
      statusCode: 200,
    });
  } catch (error) {
    console.error("Booking error:", error);
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
      deliveryStatus,
      pageNo = 1,
      pageCount = 100,
      sortByField,
      sortByOrder,
    } = req.body;

    const query = {};
    if (status) query.status = status;
    if (searchKey) query.name = { $regex: searchKey, $options: "i" };
    if (deliveryStatus) query["product.deliveryStatus"] = deliveryStatus;

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
        path: "userId",
      })
      .populate({
        path: "addressId",
      })
      .populate({
        path: "product.productId",
        select: "name",
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
      .populate({
        path: "product.productId",
        select:
          "name productType tax madeIn hsnCode shortDescription createdBy status isProductReturnable isCodAllowed isProductTaxIncluded isProductCancelable productGallery isActive productOtherDetails updatedAt createdAt brandId description discountedPrice guaranteePeriod maxOrderQuantity minOrderQuantity price productVideoUrl stockQuantity warrantyPeriod productHeroImage productVideo",
      })
      .populate({
        path: "userId",
        select: "name email mobileNumber",
      });

    return sendResponse(res, 200, "Success", {
      message: "Booking details fetched successfully",
      data: booking,
      statusCode: 200,
    });
  } catch (error) {
    return sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error.",
      statusCode: 500,
    });
  }
});

bookingController.put("/update", async (req, res) => {
  try {
    const { id, productId, deliveryStatus } = req.body;

    // Validate input
    if (!id || !productId || !deliveryStatus) {
      return sendResponse(res, 400, "Failed", {
        message: "Missing booking ID, product ID, or delivery status.",
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

    // Update the specific product's deliveryStatus
    const updatedBooking = await Booking.findOneAndUpdate(
      {
        _id: id,
        "product.productId": productId,
      },
      {
        $set: {
          "product.$.deliveryStatus": deliveryStatus,
        },
      },
      { new: true }
    );

    if (!updatedBooking) {
      return sendResponse(res, 404, "Failed", {
        message: "Booking or product not found.",
        statusCode: 404,
      });
    }
    const superAdmin = await Admin.findOne({
      role: "680e3c4dd3f86cb24e34f6a6",
    });
    const userDetails = await User.findOne({ _id: updatedBooking.userId });
    const productDetails = await Product.findOne({ _id: productId });
    const venderDetails = await Vender.findOne({
      _id: productDetails.createdBy,
    });
    if (deliveryStatus == "orderPacked") {
      sendNotification({
        title: "Order Packed",
        subTitle: "Please assign a driver for this booking",
        icon: "https://cdn-icons-png.flaticon.com/128/190/190411.png",
        notifyUserId: "admin",
        category: "Booking",
        subCategory: "Order Packed",
        notifyUser: "Admin",
        fcmToken: superAdmin.deviceId,
      });

      sendNotification({
        title: "Order Packed",
        subTitle: "Your order has been packed by the vendor",
        icon: "https://cdn-icons-png.flaticon.com/128/190/190411.png",
        notifyUserId: userDetails._id,
        category: "Booking",
        subCategory: "Order Packed",
        notifyUser: "User",
        fcmToken: userDetails.androidDeviceId,
      });

      sendNotification({
        title: "Order Packed",
        subTitle: "Your order has been marked as packed, driver coming soon ",
        icon: "https://cdn-icons-png.flaticon.com/128/190/190411.png",
        notifyUserId: venderDetails._id,
        category: "Booking",
        subCategory: "Order Packed",
        notifyUser: "Vender",
        fcmToken: venderDetails.androidDeviceId,
      });
    }
    return sendResponse(res, 200, "Success", {
      message: "Delivery status updated successfully.",
      data: updatedBooking,
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error.",
      statusCode: 500,
    });
  }
});

bookingController.get("/order-details/:orderId", async (req, res) => {
  try {
    const orderId = req.params.orderId;

    const booking = await Booking.findById(orderId)
      .populate({
        path: "product.productId",
        select:
          "name productType tax madeIn hsnCode shortDescription createdBy status zipcodeId isProductReturnable isCodAllowed isProductTaxIncluded isProductCancelable productGallery isActive updatedAt createdAt brandId categoryId description discountedPrice guaranteePeriod maxOrderQuantity minOrderQuantity price productVideoUrl stockQuantity subCategoryId warrantyPeriod productHeroImage productVideo",
      })
      .populate({
        path: "userId",
        select: "name email mobileNumber",
      });

    if (booking) {
      return sendResponse(res, 200, "Success", {
        message: "Order details fetched successfully",
        data: booking,
        statusCode: 200,
      });
    } else {
      return sendResponse(res, 404, "Failed", {
        message: "Order not found",
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

bookingController.put("/cancel-product", async (req, res) => {
  try {
    const { bookingId, productId, cancelReason, cancelledBy } = req.body;

    // Validate required fields
    if (!bookingId || !productId || !cancelReason || !cancelledBy) {
      return sendResponse(res, 400, "Failed", {
        message:
          "Missing required fields: bookingId, productId, cancelReason, or cancelledBy",
      });
    }

    // Validate cancelledBy role
    const validRoles = ["Driver", "User", "Vender"];
    if (!validRoles.includes(cancelledBy)) {
      return sendResponse(res, 400, "Failed", {
        message:
          "Invalid cancelledBy role. Must be one of: Driver, User, Vender",
      });
    }

    // Update the product in the booking
    const updatedBooking = await Booking.findOneAndUpdate(
      {
        _id: bookingId,
        "product.productId": productId,
      },
      {
        $set: {
          "product.$.deliveryStatus": "cancelled",
          "product.$.cancelledBy": cancelledBy,
          "product.$.cancelReason": cancelReason,
        },
      },
      { new: true }
    );

    if (!updatedBooking) {
      return sendResponse(res, 404, "Failed", {
        message: "Booking or product not found",
      });
    }

    return sendResponse(res, 200, "Success", {
      message: `Product cancelled successfully by ${cancelledBy}`,
      data: updatedBooking,
    });
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});

bookingController.put("/mark-not-delivered", async (req, res) => {
  try {
    const { bookingId, productId, orderNotDeliveredReason } = req.body;

    // Validate required fields
    if (!bookingId || !productId || !orderNotDeliveredReason) {
      return sendResponse(res, 400, "Failed", {
        message: "Missing required fields: bookingId, productId, or reason",
      });
    }

    // Make sure booking and product exist
    const booking = await Booking.findOne({ _id: bookingId });

    if (!booking) {
      return sendResponse(res, 404, "Failed", {
        message: "Booking not found",
      });
    }

    const product = booking.product.find(
      (p) => p.productId.toString() === productId
    );

    if (!product) {
      return sendResponse(res, 404, "Failed", {
        message: "Product not found in booking",
      });
    }

    // Only update the not delivered reason (no cancel/update to cancelledBy)
    const updatedBooking = await Booking.findOneAndUpdate(
      {
        _id: bookingId,
        "product.productId": productId,
      },
      {
        $set: {
          "product.$.orderNotDeliveredReason": orderNotDeliveredReason,
        },
      },
      { new: true }
    );

    return sendResponse(res, 200, "Success", {
      message: "Order not delivered reason submitted successfully",
      data: updatedBooking,
    });
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});

bookingController.put("/mark-all", async (req, res) => {
  try {
    const { id, productIds, deliveryStatus } = req.body;

    if (
      !id ||
      !productIds ||
      !Array.isArray(productIds) ||
      productIds.length === 0 ||
      !deliveryStatus
    ) {
      return sendResponse(res, 400, "Failed", {
        message: "Missing booking ID, product IDs array, or delivery status.",
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
        },
      },
      {
        arrayFilters: [{ "elem.productId": { $in: productIds } }],
        new: true,
      }
    ).lean();

    if (!updatedBooking) {
      return sendResponse(res, 404, "Failed", {
        message: "Booking or products not found.",
        statusCode: 404,
      });
    }

    const isAllProductsMarkedPacked = updatedBooking.product.every(
      (p) => p.deliveryStatus === "orderPacked"
    );

    if (isAllProductsMarkedPacked) {
      const approvedDrivers = await Driver.find({ profileStatus: "approved" });

      const userLocation = {
        latitude: parseFloat(updatedBooking.address?.lat || 0),
        longitude: parseFloat(updatedBooking.address?.long || 0),
      };

      const productDetails = await Product.find({ _id: { $in: productIds } });

      const vendorLocations = await Promise.all(
        productDetails.map(async (p) => {
          const vendor = await Vender.findOne({ _id: p.createdBy });
          return {
            vendorId: vendor._id,
            latitude: parseFloat(vendor.lat),
            longitude: parseFloat(vendor.long),
          };
        })
      );

      const driverDistances = approvedDrivers
        .map((driver) => {
          if (!driver.lat || !driver.long) return null;

          const driverLocation = {
            latitude: parseFloat(driver.lat),
            longitude: parseFloat(driver.long),
          };

          const optimizedRoute = getOptimizedRoute(
            driverLocation,
            vendorLocations,
            userLocation
          );

          let totalDistance = 0;
          let currentLocation = driverLocation;

          optimizedRoute.forEach((nextStop) => {
            totalDistance += haversine(currentLocation, nextStop);
            currentLocation = nextStop;
          });

          return {
            driverId: driver._id,
            driverName: driver.firstName,
            totalDistance: (totalDistance / 1000).toFixed(2),
          };
        })
        .filter(Boolean);

      console.log("Optimized Driver Distances:", driverDistances);
    }

    if (deliveryStatus === "orderPacked") {
      const superAdmin = await Admin.findOne({
        role: "680e3c4dd3f86cb24e34f6a6",
      });
      const userDetails = await User.findOne({ _id: updatedBooking.userId });

      for (const productId of productIds) {
        const productInBooking = updatedBooking.product.find(
          (p) => p.productId.toString() === productId
        );

        if (!productInBooking) continue;

        const productDetails = await Product.findOne({ _id: productId });
        const venderDetails = await Vender.findOne({
          _id: productDetails.createdBy,
        });

        // 🧮 Reduce stockQuantity (correct field)
        const currentStock = productDetails.stockQuantity || 0;
        const orderedQty = productInBooking.quantity || 0;
        const updatedStock = currentStock - orderedQty;

        if (updatedStock < 0) {
          console.warn(`Warning: Negative stock for product ${productDetails.name}`);
        }

        await Product.updateOne(
          { _id: productId },
          {
            $set: {
              stockQuantity: updatedStock < 0 ? 0 : updatedStock,
            },
          }
        );

        // 🔔 Notifications
        await sendNotification({
          title: "Order Packed",
          subTitle: "Please assign a driver for this booking",
          icon: "https://cdn-icons-png.flaticon.com/128/190/190411.png",
          notifyUserId: "admin",
          category: "Booking",
          subCategory: "Order Packed",
          notifyUser: "Admin",
          fcmToken: superAdmin?.deviceId,
        });

        await sendNotification({
          title: "Order Packed",
          subTitle: "Your order has been packed by the vendor",
          icon: "https://cdn-icons-png.flaticon.com/128/190/190411.png",
          notifyUserId: userDetails?._id,
          category: "Booking",
          subCategory: "Order Packed",
          notifyUser: "User",
          fcmToken: userDetails?.androidDeviceId,
        });

        await sendNotification({
          title: "Order Packed",
          subTitle: "Your order has been marked as packed, driver coming soon",
          icon: "https://cdn-icons-png.flaticon.com/128/190/190411.png",
          notifyUserId: venderDetails?._id,
          category: "Booking",
          subCategory: "Order Packed",
          notifyUser: "Vender",
          fcmToken: venderDetails?.androidDeviceId,
        });
      }
    }

    return sendResponse(res, 200, "Success", {
      message: "Delivery status updated successfully for selected products.",
      data: updatedBooking,
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error.",
      statusCode: 500,
    });
  }
});


// new api for assigning driver auto and making product as packed

bookingController.put("/mark-product-as-packed", async (req, res) => {
  try {
    const { id, productIds, deliveryStatus } = req.body;
    if (
      !id ||
      !productIds ||
      !Array.isArray(productIds) ||
      productIds.length === 0 ||
      !deliveryStatus
    ) {
      return sendResponse(res, 400, "Failed", {
        message: "Missing booking ID, product IDs array, or delivery status.",
      });
    }
    const allowedStatuses = [
      "orderPacked", 
    ];
    if (!allowedStatuses.includes(deliveryStatus)) {
      return sendResponse(res, 400, "Failed", {
        message: "Invalid delivery status provided.",
      });
    }
    // check if the vendor location and user location is in the same city or not
    
    return sendResponse(res, 200, "Success", {
      message: "Delivery status updated successfully for selected products.",
      // data: updatedBooking,
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error.",
      statusCode: 500,
    });
  }
});

module.exports = bookingController;
