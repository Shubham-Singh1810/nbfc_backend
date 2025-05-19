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

<<<<<<< HEAD

=======
>>>>>>> d0728d613466a09326ec1c0b28faf357b4862827
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
        statusCode:404
      });
    }

    return sendResponse(res, 200, "Success", {
      message: "Delivery status updated successfully.",
      data: updatedBooking,
      statusCode:200
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error.",
      statusCode:500
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

    // Validate input
    if (!id || !productIds || !Array.isArray(productIds) || productIds.length === 0 || !deliveryStatus) {
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

    // Update deliveryStatus for all matching products in a single booking
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
    );

    if (!updatedBooking) {
      return sendResponse(res, 404, "Failed", {
        message: "Booking or products not found.",
        statusCode: 404,
      });
    }

    return sendResponse(res, 200, "Success", {
      message: "Delivery status updated successfully for selected products.",
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


module.exports = bookingController;
