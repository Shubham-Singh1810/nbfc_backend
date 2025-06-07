const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const Booking = require("../model/booking.Schema");
const AdminFund = require("../model/adminFund.Schema");
const User = require("../model/user.Schema");
const Vender = require("../model/vender.Schema");
const Product = require("../model/product.Schema");
const Address = require("../model/address.Schema");
const Driver = require("../model/driver.Schema");
const Admin = require("../model/admin.Schema");
const bookingController = express.Router();
require("dotenv").config();
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");
const moment = require("moment");
const auth = require("../utils/auth");
const geolib = require("geolib");
const fs = require("fs");
const path = require("path");
const {sendNotification} = require("../utils/sendNotification")



// bookingController.post("/create", async (req, res) => {
//   try {
//     const {
//       userId,
//       totalAmount,
//       status,
//       product,
//       bookingQuantity,
//       bookingPrice,
//       modeOfPayment,
//       paymentId,
//       signature,
//       orderId,
//       addressId,
//     } = req.body;

//     if (!userId || !status) {
//       return sendResponse(res, 400, "Failed", {
//         message: !userId ? "userId is required" : "status is required",
//         statusCode: 400,
//       });
//     }

//     // Add expectedDeliveryDate to each product
//     const updatedProducts = product.map((item) => ({
//       ...item,
//       expectedDeliveryDate: moment().add(7, "days").format("DD-MM-YYYY"),
//     }));

//     const bookingData = {
//       userId,
//       totalAmount,
//       status,
//       product: updatedProducts,
//       bookingQuantity,
//       bookingPrice,
//       modeOfPayment,
//       paymentId,
//       signature,
//       orderId,
//       addressId,
//     };

//     // Create booking
//     const bookingCreated = await Booking.create(bookingData);

//     // Clear user cart
//     const updatedUser = await User.findByIdAndUpdate(
//       userId,
//       { $set: { cartItems: [] } },
//       { new: true }
//     );

//     // Notify Admin
//     const superAdmin = await Admin.findOne({ role: "680e3c4dd3f86cb24e34f6a6" });
//     if (superAdmin?.deviceId) {
//       await sendNotification({
//         title: "New Order",
//         subTitle: `${updatedUser?.firstName} has placed a new order.`,
//         icon: updatedUser?.profilePic,
//         notifyUserId: "admin",
//         category: "Booking",
//         subCategory: "New Order",
//         notifyUser: "Admin",
//         fcmToken: superAdmin.deviceId,
//       });
//     }

//     // Notify User
//     if (updatedUser?.androidDeviceId) {
//       await sendNotification({
//         title: "Order Placed",
//         subTitle: `Your order has been placed successfully.`,
//         icon: "https://cdn-icons-png.flaticon.com/128/190/190411.png",
//         notifyUserId: userId,
//         category: "Booking",
//         subCategory: "New Order",
//         notifyUser: "User",
//         fcmToken: updatedUser.androidDeviceId,
//       });
//     }

//     // Populate productId to access createdBy (vendor ID)
//     const populatedBooking = await Booking.findById(bookingCreated._id).populate("product.productId");

//     for (const item of populatedBooking.product) {
//       const createdById = item.productId?.createdBy;

//       if (!createdById) {
//         console.warn("Product createdBy missing, skipping vendor notification.");
//         continue;
//       }

//       const vendor = await Vender.findById(createdById);
//       if (!vendor || !vendor.androidDeviceId) {
//         console.warn(`Vendor or FCM token missing for vendor ID: ${createdById}`);
//         continue;
//       }

//       await sendNotification({
//         title: "New Order",
//         subTitle: `${updatedUser?.firstName} has placed a new order.`,
//         icon: updatedUser?.profilePic,
//         notifyUserId: vendor._id,
//         category: "Booking",
//         subCategory: "New Order",
//         notifyUser: "Vender",
//         fcmToken: vendor.androidDeviceId,
//       });

//       console.log(`Notification sent to vendor ID: ${vendor._id}`);
//     }

//     sendResponse(res, 200, "Success", {
//       message: "Booking created successfully!",
//       data: bookingCreated,
//       statusCode: 200,
//     });
//   } catch (error) {
//     console.error("Booking error:", error);
//     sendResponse(res, 500, "Failed", {
//       message: error.message || "Internal server error",
//       statusCode: 500,
//     });
//   }
// });


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

    if (!userId || !status) {
      return sendResponse(res, 400, "Failed", {
        message: !userId ? "userId is required" : "status is required",
        statusCode: 400,
      });
    }

    // Add expectedDeliveryDate to each product
    const updatedProducts = product.map((item) => ({
      ...item,
      expectedDeliveryDate: moment().add(7, "days").format("DD-MM-YYYY"),
    }));

    const bookingData = {
      userId,
      totalAmount,
      status,
      product: updatedProducts,
      bookingQuantity,
      bookingPrice,
      modeOfPayment,
      paymentId,
      signature,
      orderId,
      addressId,
    };

    // Create booking
    const bookingCreated = await Booking.create(bookingData);

    // Clear user cart
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { cartItems: [] } },
      { new: true }
    );

    const superAdmin = await Admin.findOne({ role: "680e3c4dd3f86cb24e34f6a6" });

    // Step 1: Admin Fund Wallet Update (Amount goes to Admin wallet)
    if (modeOfPayment == "Online") {
      let adminFund = await AdminFund.findOne(); 

    const updatedWalletAmount = (parseFloat(adminFund.wallet || 0) + parseFloat(totalAmount)).toFixed(2);
    const newTransaction = {
      message: `Order amount ₹${totalAmount} credited to admin wallet for user ${updatedUser.firstName}`,
      transactionType: "credit",
      date: moment().format("YYYY-MM-DD HH:mm:ss"),
      amount:totalAmount
    };

    adminFund.wallet = updatedWalletAmount;
    adminFund.totalEarnings = adminFund.totalEarnings+totalAmount
    adminFund.transactionHistory = adminFund.transactionHistory || [];
    adminFund.transactionHistory.push(newTransaction);
    await adminFund.save();
   
    if (superAdmin?.deviceId) {
      await sendNotification({
        title: "Wallet",
        subTitle: `You recieved ${totalAmount} for a new booking `,
        icon: "https://cdn-icons-png.flaticon.com/128/6020/6020135.png",
        notifyUserId: "admin",
        category: "Wallet",
        subCategory: "Credit",
        notifyUser: "Admin",
        fcmToken: superAdmin.deviceId,
      });
    }
  }

    // Notify Admin — New Order Placed
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

    // Notify User
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

    // Populate productId to access createdBy (vendor ID)
    const populatedBooking = await Booking.findById(bookingCreated._id).populate("product.productId");

    for (const item of populatedBooking.product) {
      const createdById = item.productId?.createdBy;

      if (!createdById) {
        console.warn("Product createdBy missing, skipping vendor notification.");
        continue;
      }

      const vendor = await Vender.findById(createdById);
      if (!vendor || !vendor.androidDeviceId) {
        console.warn(`Vendor or FCM token missing for vendor ID: ${createdById}`);
        continue;
      }

      // await sendNotification({
      //   title: "New Order",
      //   subTitle: `${updatedUser?.firstName} has placed a new order.`,
      //   icon: updatedUser?.profilePic,
      //   notifyUserId: vendor._id,
      //   category: "Booking",
      //   subCategory: "New Order",
      //   notifyUser: "Vender",
      //   fcmToken: vendor.androidDeviceId,
      // });

      console.log(`Notification sent to vendor ID: ${vendor._id}`);
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
        statusCode:404
      });
    }
    const superAdmin = await Admin.findOne({ role: "680e3c4dd3f86cb24e34f6a6" });
    const userDetails = await User.findOne({ _id: updatedBooking.userId });
    const productDetails = await Product.findOne({ _id:productId });
    const venderDetails = await Vender.findOne({ _id:productDetails.createdBy });
    if(deliveryStatus == "orderPacked"){
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

// bookingController.put("/mark-all", async (req, res) => {
//   try {
//     const { id, productIds, deliveryStatus } = req.body;

//     // Validate input
//     if (!id || !productIds || !Array.isArray(productIds) || productIds.length === 0 || !deliveryStatus) {
//       return sendResponse(res, 400, "Failed", {
//         message: "Missing booking ID, product IDs array, or delivery status.",
//       });
//     }

//     const allowedStatuses = [
//       "orderPlaced",
//       "orderPacked",
//       "driverAssigned",
//       "driverAccepted",
//       "pickedOrder",
//       "completed",
//       "cancelled",
//     ];

//     if (!allowedStatuses.includes(deliveryStatus)) {
//       return sendResponse(res, 400, "Failed", {
//         message: "Invalid delivery status provided.",
//       });
//     }

//     // Update deliveryStatus for all matching products in a single booking
//     const updatedBooking = await Booking.findOneAndUpdate(
//       { _id: id },
//       {
//         $set: {
//           "product.$[elem].deliveryStatus": deliveryStatus,
//         },
//       },
//       {
//         arrayFilters: [{ "elem.productId": { $in: productIds } }],
//         new: true,
//       }
//     );

//     if (!updatedBooking) {
//       return sendResponse(res, 404, "Failed", {
//         message: "Booking or products not found.",
//         statusCode: 404,
//       });
//     }

//     return sendResponse(res, 200, "Success", {
//       message: "Delivery status updated successfully for selected products.",
//       data: updatedBooking,
//       statusCode: 200,
//     });
//   } catch (error) {
//     console.error(error);
//     sendResponse(res, 500, "Failed", {
//       message: error.message || "Internal server error.",
//       statusCode: 500,
//     });
//   }
// });


// bookingController.put("/mark-all", async (req, res) => {
//   try {
//     const { id, productIds, deliveryStatus } = req.body;

//     if (
//       !id || !productIds || !Array.isArray(productIds) || productIds.length === 0 || !deliveryStatus
//     ) {
//       return sendResponse(res, 400, "Failed", {
//         message: "Missing booking ID, product IDs array, or delivery status.",
//       });
//     }

//     const allowedStatuses = [
//       "orderPlaced",
//       "orderPacked",
//       "driverAssigned",
//       "driverAccepted",
//       "pickedOrder",
//       "completed",
//       "cancelled",
//     ];

//     if (!allowedStatuses.includes(deliveryStatus)) {
//       return sendResponse(res, 400, "Failed", {
//         message: "Invalid delivery status provided.",
//       });
//     }

//     // Update deliveryStatus for all matching products in a single booking
//     const updatedBooking = await Booking.findOneAndUpdate(
//       { _id: id },
//       {
//         $set: {
//           "product.$[elem].deliveryStatus": deliveryStatus,
//         },
//       },
//       {
//         arrayFilters: [{ "elem.productId": { $in: productIds } }],
//         new: true,
//       }
//     );
//     let isAllProductsMarkedPacked = true;
//     for(let i = 0; i<updatedBooking.product.length; i++){
//       if(updatedBooking.product[i].deliveryStatus!="orderPacked"){
//          isAllProductsMarkedPacked = false;
//          break;
//       }
//     }
//     if(isAllProductsMarkedPacked){
//       const approvedDriver = await Driver.find({profileStatus:"approved"})

//     }

//     if (!updatedBooking) {
//       return sendResponse(res, 404, "Failed", {
//         message: "Booking or products not found.",
//         statusCode: 404,
//       });
//     }

//     // Send notifications if status is 'orderPacked'
//     if (deliveryStatus === "orderPacked") {
//       const superAdmin = await Admin.findOne({ role: "680e3c4dd3f86cb24e34f6a6" });
//       const userDetails = await User.findOne({ _id: updatedBooking.userId });

//       for (const productId of productIds) {
//         const productDetails = await Product.findOne({ _id: productId });
//         const venderDetails = await Vender.findOne({ _id: productDetails.createdBy });

//         // Admin notification
//         sendNotification({
//           title: "Order Packed",
//           subTitle: "Please assign a driver for this booking",
//           icon: "https://cdn-icons-png.flaticon.com/128/190/190411.png",
//           notifyUserId: "admin",
//           category: "Booking",
//           subCategory: "Order Packed",
//           notifyUser: "Admin",
//           fcmToken: superAdmin?.deviceId,
//         });

//         // User notification
//         sendNotification({
//           title: "Order Packed",
//           subTitle: "Your order has been packed by the vendor",
//           icon: "https://cdn-icons-png.flaticon.com/128/190/190411.png",
//           notifyUserId: userDetails?._id,
//           category: "Booking",
//           subCategory: "Order Packed",
//           notifyUser: "User",
//           fcmToken: userDetails?.androidDeviceId,
//         });

//         // Vendor notification
//         sendNotification({
//           title: "Order Packed",
//           subTitle: "Your order has been marked as packed, driver coming soon",
//           icon: "https://cdn-icons-png.flaticon.com/128/190/190411.png",
//           notifyUserId: venderDetails?._id,
//           category: "Booking",
//           subCategory: "Order Packed",
//           notifyUser: "Vender",
//           fcmToken: venderDetails?.androidDeviceId,
//         });
//       }
//     }

//     return sendResponse(res, 200, "Success", {
//       message: "Delivery status updated successfully for selected products.",
//       data: updatedBooking,
//       statusCode: 200,
//     });
//   } catch (error) {
//     console.error(error);
//     sendResponse(res, 500, "Failed", {
//       message: error.message || "Internal server error.",
//       statusCode: 500,
//     });
//   }
// });


// bookingController.put("/mark-all", async (req, res) => {
//   try {
//     const { id, productIds, deliveryStatus } = req.body;

//     if (!id || !productIds || !Array.isArray(productIds) || productIds.length === 0 || !deliveryStatus) {
//       return sendResponse(res, 400, "Failed", {
//         message: "Missing booking ID, product IDs array, or delivery status.",
//       });
//     }

//     const allowedStatuses = [
//       "orderPlaced", "orderPacked", "driverAssigned", "driverAccepted",
//       "pickedOrder", "completed", "cancelled",
//     ];

//     if (!allowedStatuses.includes(deliveryStatus)) {
//       return sendResponse(res, 400, "Failed", {
//         message: "Invalid delivery status provided.",
//       });
//     }

//     const updatedBooking = await Booking.findOneAndUpdate(
//       { _id: id },
//       {
//         $set: {
//           "product.$[elem].deliveryStatus": deliveryStatus,
//         },
//       },
//       {
//         arrayFilters: [{ "elem.productId": { $in: productIds } }],
//         new: true,
//       }
//     ).lean();

//     if (!updatedBooking) {
//       return sendResponse(res, 404, "Failed", {
//         message: "Booking or products not found.",
//         statusCode: 404,
//       });
//     }

//     const isAllProductsMarkedPacked = updatedBooking.product.every(
//       (p) => p.deliveryStatus === "orderPacked"
//     );

//     if (isAllProductsMarkedPacked) {
//       const approvedDrivers = await Driver.find({ profileStatus: "approved" }).lean();

//       const vendorIds = updatedBooking.product.map((p) => p.createdBy);
//       const vendors = await Vender.find({ _id: { $in: vendorIds } }).lean();
//       const vendorLocations = vendors.map((v) => {v.lat, v.long});

//       const userAddress = await Address.findById(updatedBooking.userId).lean();
//       const userLocation = {lat:user.lat, long:user.long};

//       if (!userLocation || !userLocation.lat || !userLocation.long) {
//         return sendResponse(res, 400, "Failed", {
//           message: "User delivery location is missing or invalid.",
//         });
//       }

//       const allLocations = [...vendorLocations, userLocation];
//       const avgLat = allLocations.reduce((sum, loc) => sum + loc.lat, 0) / allLocations.length;
//       const avgLng = allLocations.reduce((sum, loc) => sum + loc.long, 0) / allLocations.length;

//       const maxDistance = 20; // km
//       const availableDrivers = approvedDrivers.filter((driver) => {
//         const dx = driver.location.lat - avgLat;
//         const dy = driver.location.long - avgLng;
//         const distance = Math.sqrt(dx * dx + dy * dy) * 111; // approx. km
//         return distance <= maxDistance;
//       });

//       let assignedDriver = null;
//       for (const driver of availableDrivers) {
//         const hasOngoingOrder = await Booking.findOne({
//           driverId: driver._id,
//           deliveryStatus: { $in: ["driverAssigned", "driverAccepted", "pickedOrder"] },
//         });
//         if (!hasOngoingOrder) {
//           assignedDriver = driver;
//           break;
//         }
//       }

//       if (assignedDriver) {
//         await Booking.findByIdAndUpdate(updatedBooking._id, {
//           driverId: assignedDriver._id,
//           deliveryStatus: "driverAssigned",
//         });
//       }
//     }

//     if (deliveryStatus === "orderPacked") {
//       const superAdmin = await Admin.findOne({ role: "680e3c4dd3f86cb24e34f6a6" });
//       const userDetails = await User.findOne({ _id: updatedBooking.userId });

//       for (const productId of productIds) {
//         const productDetails = await Product.findOne({ _id: productId });
//         const venderDetails = await Vender.findOne({ _id: productDetails.createdBy });

//         sendNotification({
//           title: "Order Packed",
//           subTitle: "Please assign a driver for this booking",
//           icon: "https://cdn-icons-png.flaticon.com/128/190/190411.png",
//           notifyUserId: "admin",
//           category: "Booking",
//           subCategory: "Order Packed",
//           notifyUser: "Admin",
//           fcmToken: superAdmin?.deviceId,
//         });

//         sendNotification({
//           title: "Order Packed",
//           subTitle: "Your order has been packed by the vendor",
//           icon: "https://cdn-icons-png.flaticon.com/128/190/190411.png",
//           notifyUserId: userDetails?._id,
//           category: "Booking",
//           subCategory: "Order Packed",
//           notifyUser: "User",
//           fcmToken: userDetails?.androidDeviceId,
//         });

//         sendNotification({
//           title: "Order Packed",
//           subTitle: "Your order has been marked as packed, driver coming soon",
//           icon: "https://cdn-icons-png.flaticon.com/128/190/190411.png",
//           notifyUserId: venderDetails?._id,
//           category: "Booking",
//           subCategory: "Order Packed",
//           notifyUser: "Vender",
//           fcmToken: venderDetails?.androidDeviceId,
//         });
//       }
//     }

//     return sendResponse(res, 200, "Success", {
//       message: "Delivery status updated successfully for selected products.",
//       data: updatedBooking,
//       statusCode: 200,
//     });
//   } catch (error) {
//     console.error(error);
//     return sendResponse(res, 500, "Failed", {
//       message: error.message || "Internal server error.",
//       statusCode: 500,
//     });
//   }
// });

bookingController.put("/mark-all", async (req, res) => {
  try {
    const { id, productIds, deliveryStatus } = req.body;

    if (!id || !productIds || !Array.isArray(productIds) || productIds.length === 0 || !deliveryStatus) {
      return sendResponse(res, 400, "Failed", {
        message: "Missing booking ID, product IDs array, or delivery status.",
      });
    }

    const allowedStatuses = [
      "orderPlaced", "orderPacked", "driverAssigned", "driverAccepted",
      "pickedOrder", "completed", "cancelled",
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
      const approvedDrivers = await Driver.find({ profileStatus: "approved" }).lean();

      const vendorIds = updatedBooking.product.map((p) => p.createdBy);
      const vendors = await Vender.find({ _id: { $in: vendorIds } }).lean();
      const vendorPincodes = vendors.map((v) => v.pincode).filter(Boolean);

      const userAddress = await Address.findOne({ userId: updatedBooking.addressId }).lean();
      const userPincode = userAddress?.pincode;

      if (!userPincode) {
        return sendResponse(res, 400, "Failed", {
          message: "User delivery pincode is missing or invalid.",
        });
      }

      const relevantPincodes = [...new Set([...vendorPincodes, userPincode])];

      const availableDrivers = await Driver.find({
        profileStatus: "approved",
        pincode: { $in: relevantPincodes },
      }).lean();

      let assignedDriver = null;
      for (const driver of availableDrivers) {
        const hasOngoingOrder = await Booking.findOne({
          "product": {
            $elemMatch: {
              driverId: driver._id,
              deliveryStatus: { $in: ["driverAssigned", "driverAccepted", "pickedOrder"] }
            }
          }
        });
      
        if (!hasOngoingOrder) {
          assignedDriver = driver;
          break;
        }
      }      

      if (assignedDriver) {
        await Booking.findByIdAndUpdate(updatedBooking._id, {
          driverId: assignedDriver._id,
          deliveryStatus: "driverAssigned",
        });
      }
    }

    if (deliveryStatus === "orderPacked") {
      const superAdmin = await Admin.findOne({ role: "680e3c4dd3f86cb24e34f6a6" });
      const userDetails = await User.findOne({ _id: updatedBooking.userId });

      for (const productId of productIds) {
        const productDetails = await Product.findOne({ _id: productId });
        const venderDetails = await Vender.findOne({ _id: productDetails.createdBy });

        sendNotification({
          title: "Order Packed",
          subTitle: "Please assign a driver for this booking",
          icon: "https://cdn-icons-png.flaticon.com/128/190/190411.png",
          notifyUserId: "admin",
          category: "Booking",
          subCategory: "Order Packed",
          notifyUser: "Admin",
          fcmToken: superAdmin?.deviceId,
        });

        sendNotification({
          title: "Order Packed",
          subTitle: "Your order has been packed by the vendor",
          icon: "https://cdn-icons-png.flaticon.com/128/190/190411.png",
          notifyUserId: userDetails?._id,
          category: "Booking",
          subCategory: "Order Packed",
          notifyUser: "User",
          fcmToken: userDetails?.androidDeviceId,
        });

        sendNotification({
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


module.exports = bookingController;
