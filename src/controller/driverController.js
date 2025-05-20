const express = require("express");
const { sendResponse, generateOTP } = require("../utils/common");
require("dotenv").config();
const Driver = require("../model/driver.Schema");
const Booking = require("../model/booking.Schema");
const driverController = express.Router();
const axios = require("axios");
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
      sendNotification({
        icon:newDriver.profilePic,
        title:"A new driver registered",
        subTitle:`${newDriver.firstName} has registered to the portal`,
        notifyUserId:"Admin",
        category:"Driver",
        subCategory:"Registration",
        notifyUser:"Admin",
      },req.io)

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

      sendNotification({
        icon: updatedDriver.profilePic,
        title: `${updatedDriver.firstName} has verified their phone number`,
        subTitle: `${updatedDriver.firstName} has verified their phone number`,
        notifyUserId: "Admin",
        category: "Driver",
        subCategory: "Verification",
        notifyUser: "Admin",
      });

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
        return sendResponse(res, 422, "Failed", {
          message: "Unable to send OTP",
          statusCode: 200,
        });
      }
    } else {
      return sendResponse(res, 422, "Failed", {
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

driverController.get("/details/:id", auth, async (req, res) => {
  try {
    const id = req.params.id;
    const driver = await Driver.findOne({ _id: id });
    if (driver) {
      return sendResponse(res, 200, "Success", {
        message: "Driver details fetched  successfully",
        data: driver,
        statusCode: 200,
      });
    } else {
      return sendResponse(res, 404, "Failed", {
        message: "Driver not found",
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

driverController.post("/list", auth, async (req, res) => {
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

driverController.delete("/delete/:id", auth, async (req, res) => {
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

driverController.put("/update", auth, upload.fields([
    { name: "dlFrontImage", maxCount: 1 },
    { name: "dlBackImage", maxCount: 1 },
    { name: "profilePic", maxCount: 1 },
    { name: "vehicleImage", maxCount: 1 },
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
      let updateData = {...req.body}
      if(req.file || req.files){
      
        if (req.files["dlFrontImage"]) {
          let image = await cloudinary.uploader.upload(
            req.files["dlFrontImage"][0].path
          );
          updateData = {...req.body, dlFrontImage: image.url};
        }
  
        if (req.files["dlBackImage"]) {
          let image = await cloudinary.uploader.upload(
            req.files["dlBackImage"][0].path
          );
          updateData = {...req.body, dlBackImage: image.url};
        }
        if (req.files["profilePic"]) {
          let image = await cloudinary.uploader.upload(
            req.files["profilePic"][0].path
          );
          updateData = {...req.body, profilePic: image.url};
        }
        if (req.files["vehicleImage"]) {
          let image = await cloudinary.uploader.upload(
            req.files["vehicleImage"][0].path
          );
          updateData = {...req.body, vehicleImage: image.url};
        }
        
        const updatedUserData = await Driver.findByIdAndUpdate(id, updateData, {
          new: true, 
        });
        if(req.body.profileStatus=="reUploaded"){
          sendNotification({
            icon:updatedUserData.profilePic,
            title:`${updatedUserData.firstName} has re-uploaded the details`,
            subTitle:`${updatedUserData.firstName} has re-uploaded the details`,
            notifyUserId:"Admin",
            category:"Driver",
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
            category:"Driver",
            subCategory:"Profile update",
            notifyUser:"Driver",
          }, req.io)
        }
        if(req.body.profileStatus=="approved"){
          sendNotification({
            icon:updatedUserData.profilePic,
            title:`${updatedUserData.firstName} your profile has been approved`,
            subTitle:`${updatedUserData.firstName} congratulations!! your profile has been approved`,
            notifyUserId:updatedUserData._id,
            category:"Driver",
            subCategory:"Profile update",
            notifyUser:"Driver",
          }, req.io)
        }
        sendResponse(res, 200, "Success", {
          message: "Driver updated successfully!",
          data: updatedUserData,
          statusCode: 200,
        });
      }
      else{
        const updatedUserData = await Driver.findByIdAndUpdate(id, updateData, {
          new: true, 
        });
  
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
 
// driverController.post("/assign-product", auth, async (req, res) => {
//   try {
//     const { orderId, productId, driverId } = req.body;

//     const order = await Booking.findById(orderId);
//     if (!order) {
//       return sendResponse(res, 404, "Failed", {
//         message: "Order not found",
//         statusCode: 404,
//       });
//     }

//     const driver = await Driver.findById(driverId);
//     if (!driver) {
//       return sendResponse(res, 404, "Failed", {
//         message: "Driver not found",
//         statusCode: 404,
//       });
//     }

//     let productFound = false;

//     order.product = order.product.map((item) => {
//       if (item.productId.toString() === productId) {
//         productFound = true;
//         item.driverId = driverId;
//       }
//       return item;
//     });

//     if (!productFound) {
//       return sendResponse(res, 404, "Failed", {
//         message: "Product not found in order",
//         statusCode: 404,
//       });
//     }

//     await order.save();

//     return sendResponse(res, 200, "Success", {
//       message: "Product assigned to driver successfully",
//       data: order,
//       statusCode: 200,
//     });
//   } catch (error) {
//     return sendResponse(res, 500, "Failed", {
//       message: error.message || "Internal server error.",
//       statusCode: 500,
//     });
//   }
// });


driverController.put("/assign-products", async (req, res) => {
  try {
    const { id, productIds, deliveryStatus, driverId } = req.body;

    // Validate input
    if (!id || !productIds || !Array.isArray(productIds) || productIds.length === 0 || !deliveryStatus || !driverId) {
      return sendResponse(res, 400, "Failed", {
        message: "Missing booking ID, product IDs array, delivery status, or driver ID.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(driverId)) {
      return sendResponse(res, 400, "Failed", {
        message: "Invalid driver ID format.",
      });
    }

    const allowedStatuses = [
      "orderPlaced", "orderPacked", "driverAssigned", "driverAccepted",
      "pickedOrder", "completed", "cancelled"
    ];

    if (!allowedStatuses.includes(deliveryStatus)) {
      return sendResponse(res, 400, "Failed", {
        message: "Invalid delivery status provided.",
      });
    }

    // Assuming 'product' is the array field name and inside each product, the key is 'productId'
    const updatedBooking = await Booking.findOneAndUpdate(
  { _id: id },
  {
    $set: {
      "product.$[elem].deliveryStatus": deliveryStatus,
      "product.$[elem].driverId": new mongoose.Types.ObjectId(driverId),
    },
  },
  {
    arrayFilters: [{ "elem.productId": { $in: productIds.map(id => new mongoose.Types.ObjectId(id)) } }],
    new: true,
  }
);


    if (!updatedBooking) {
      return sendResponse(res, 404, "Failed", {
        message: "Booking or products not found.",
      });
    }

    return sendResponse(res, 200, "Success", {
      message: "Driver assigned and delivery status updated successfully.",
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

driverController.get("/assigned-products-user-wise/:driverId", async (req, res) => {
  try {
    const { driverId } = req.params;

    const orders = await Booking.find({
      "product.driverId": driverId,
      "product.deliveryStatus": "driverAssigned"
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

    const result = orders.map(order => {
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

      order.product.forEach(prod => {
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
        assignedAt: order.updatedAt
      };
    }).filter(order => order.vendorProducts.length > 0); // only orders with assigned products

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
});

driverController.post("/my-orders", async (req, res) => {
  try {
    const {
      deliveryStatus,
      pageNo = 1,
      pageCount = 10,
      sortByField,
      sortByOrder,
      driverId,
      date,
    } = req.body;

    if (!driverId) {
      return sendResponse(res, 400, "Failed", {
        message: "driverId is required",
        statusCode: 400,
      });
    }

    // Build query
    const query = {
      "product.driverId": driverId
    };

    if (deliveryStatus) {
      // Ensure it's not an array
      if (Array.isArray(deliveryStatus)) {
        return sendResponse(res, 400, "Failed", {
          message: "Only one deliveryStatus is allowed",
          statusCode: 400,
        });
      }
      query["product.deliveryStatus"] = deliveryStatus;
    }

    if (date) {
      query["product.expectedDeliveryDate"] = date;
    }

    const sortField = sortByField || "createdAt";
    const sortOrder = sortByOrder === "asc" ? 1 : -1;
    const sortOption = { [sortField]: sortOrder };

    const orders = await Booking.find(query)
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
      .populate("addressId")
      .sort(sortOption)
      .skip((pageNo - 1) * pageCount)
      .limit(pageCount);

    const result = orders
      .map(order => {
        const vendorMap = new Map();

        order.product.forEach(prod => {
          if (
            prod.driverId &&
            prod.driverId._id.toString() === driverId &&
            prod.deliveryStatus === deliveryStatus
          ) {
            const vendorId = prod.productId?.createdBy?._id?.toString();
            if (!vendorId) return;

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
          modeOfPayment: order.modeOfPayment,
          paymentId: order.paymentId,
          signature: order.signature,
          orderDate: order.createdAt,
          totalAmount: order.totalAmount,
        };
      })
      .filter(order => order.vendorProducts.length > 0);

    return sendResponse(res, 200, "Success", {
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
});


module.exports = driverController;
