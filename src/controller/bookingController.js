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
    const {
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
      addressId,
    } = req.body;

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
      addressId,
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

// bookingController.get("/details/:userId", async (req, res) => {
//   try {
//     const userId = req.params.userId;
//     const booking = await Booking.find({ userId: userId })
//       .populate("product.productId")
//       .populate("userId");

//     if (booking.length > 0) {
//       return sendResponse(res, 200, "Success", {
//         message: "Booking details fetched successfully",
//         data: booking,
//         statusCode: 200,
//       });
//     } else {
//       return sendResponse(res, 404, "Failed", {
//         message: "No bookings found for this user",
//         statusCode: 404,
//       });
//     }
//   } catch (error) {
//     return sendResponse(res, 500, "Failed", {
//       message: error.message || "Internal server error.",
//       statusCode: 500,
//     });
//   }
// });

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
      });
    }

    return sendResponse(res, 200, "Success", {
      message: "Delivery status updated successfully.",
      data: updatedBooking,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error.",
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

module.exports = bookingController;
