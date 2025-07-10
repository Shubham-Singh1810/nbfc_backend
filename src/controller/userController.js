const express = require("express");
const { sendResponse, generateOTP } = require("../utils/common");
require("dotenv").config();
const User = require("../model/user.Schema");
const Vendor = require("../model/vender.Schema");
const Fund = require("../model/adminFund.Schema")
const Admin = require("../model/admin.Schema");
const Product = require("../model/product.Schema");
const Category = require("../model/category.Schema");
const SubCategory = require("../model/subCategory.Schema");
const userController = express.Router();
const axios = require("axios");
require("dotenv").config();
const Booking = require("../model/booking.Schema");
const jwt = require("jsonwebtoken");
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");
const auth = require("../utils/auth");
const { sendNotification } = require("../utils/sendNotification");
const Driver = require("../model/driver.Schema");
const moment = require("moment");

userController.post("/send-otp", async (req, res) => {
  try {
    const { phone, ...otherDetails } = req.body;
    // Check if the phone number is provided
    if (!phone) {
      return sendResponse(res, 400, "Failed", {
        message: "Phone number is required.",
        statusCode: 400,
      });
    }
    // Generate OTP
    const phoneOtp = generateOTP();

    // Check if the user exists
    let user = await User.findOne({ phone });

    if (!user) {
      // Create a new user with the provided details and OTP
      user = await User.create({
        phone,
        phoneOtp,
        ...otherDetails,
      });

      // Generate JWT token for the new user
      const token = jwt.sign(
        { userId: user._id, phone: user.phone },
        process.env.JWT_KEY
      );
      // Store the token in the user object or return it in the response
      user.token = token;
      const superAdmin = await Admin.findOne({
        role: "680e3c4dd3f86cb24e34f6a6",
      });

      user = await User.findByIdAndUpdate(user.id, { token }, { new: true });
      sendNotification({
        title: "User registered",
        subTitle: "A new user registered to the portal.",
        icon: "https://cdn-icons-png.flaticon.com/128/190/190411.png",
        notifyUserId: "admin",
        category: "User",
        subCategory: "Register",
        notifyUser: "Admin",
        fcmToken: superAdmin.deviceId,
      });
      const io = req.io;
      io.emit("new-user-registered", user);
    } else {
      // Update the existing user's OTP
      user = await User.findByIdAndUpdate(user.id, { phoneOtp }, { new: true });
    }
    const appHash = "ems/3nG2V1H"; // Apne app ka actual hash yahan dalein

    // Properly formatted OTP message for autofill
    const otpMessage = `<#> ${phoneOtp} is your OTP for verification. Do not share it with anyone.\n${appHash}`;

    let optResponse = await axios.post(
      `https://api.authkey.io/request?authkey=${
        process.env.AUTHKEY_API_KEY
      }&mobile=${phone}&country_code=91&sid=${
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
    console.error("Error in /send-otp:", error.message);
    // Respond with failure
    return sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error.",
    });
  }
});

userController.post(
  "/sign-up",
  upload.fields([{ name: "profilePic", maxCount: 1 }]),
  async (req, res) => {
    try {
      // Check if the phone number is unique
      const user = await User.findOne({ phone: req.body.phone });
      if (user) {
        return sendResponse(res, 400, "Failed", {
          message: "User is already registered.",
          statusCode: 400,
        });
      }

      // Generate OTP
      const otp = generateOTP();

      // Upload images to Cloudinary
      let profilePic;

      if (req.files["profilePic"]) {
        let image = await cloudinary.uploader.upload(
          req.files["profilePic"][0].path
        );
        profilePic = image.url;
      }

      // Create a new user with provided details
      let newUser = await User.create({
        ...req.body,
        phoneOtp: otp,
        profilePic,
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: newUser._id, phone: newUser.phone },
        process.env.JWT_KEY
      );

      // Store the token in the user object or return it in the response
      newUser.token = token;
      const updatedUser = await User.findByIdAndUpdate(
        newUser._id,
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
          data: updatedUser,
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

userController.post("/otp-verification", async (req, res) => {
  try {
    const { phone, phoneOtp } = req.body;
    const user = await User.findOne({ phone, phoneOtp });
    if (user) {
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { isPhoneVerified: true },
        { new: true }
      );
      return sendResponse(res, 200, "Success", {
        message: "Otp verified successfully",
        data: updatedUser,
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

userController.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;
    const user = await User.findOne({ phone, password });
    if (user) {
      return sendResponse(res, 200, "Success", {
        message: "User logged in successfully",
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

userController.post("/resend-otp", async (req, res) => {
  try {
    const { phone } = req.body;
    const user = await User.findOne({ phone });
    if (user) {
      const otp = generateOTP();
      const updatedUser = await User.findByIdAndUpdate(
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
          data: updatedUser,
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

userController.get("/details/:id", auth, async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findOne({ _id: id });
    if (user) {
      return sendResponse(res, 200, "Success", {
        message: "User details fetched  successfully",
        data: user,
        statusCode: 200,
      });
    } else {
      return sendResponse(res, 404, "Failed", {
        message: "User not found",
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

userController.post("/list", async (req, res) => {
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
    if (searchKey) {
      query.$or = [
        { firstName: { $regex: searchKey, $options: "i" } },
        { lastName: { $regex: searchKey, $options: "i" } },
      ];
    }

    // Construct sorting object
    const sortField = sortByField || "createdAt";
    const sortOrder = sortByOrder === "asc" ? 1 : -1;
    const sortOption = { [sortField]: sortOrder };

    // Fetch the user list
    const userList = await User.find(query)
      .sort(sortOption)
      .limit(parseInt(pageCount))
      .skip(parseInt(pageNo - 1) * parseInt(pageCount));
    const totalCount = await User.countDocuments({});
    const activeCount = await User.countDocuments({ status: true });
    sendResponse(res, 200, "Success", {
      message: "User list retrieved successfully!",
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
    });
  }
});

userController.post("/add-to-cart/:id", auth, async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { userId: currentUserId } = req.body;

    if (!productId || !currentUserId) {
      return sendResponse(res, 422, "Failed", {
        message: "Missing productId or userId!",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return sendResponse(res, 400, "Failed", {
        message: "Product not found!",
      });
    }

    const user = await User.findById(currentUserId);
    if (!user) {
      return sendResponse(res, 400, "Failed", {
        message: "User not found!",
      });
    }

    // Ensure cartItems is an array
    if (!Array.isArray(user.cartItems)) {
      user.cartItems = [];
    }

    // Check if product already exists in cart
    const cartItemIndex = user.cartItems.findIndex(
      (item) => item.productId.toString() === productId
    );

    let updateQuery;
    let message;

    if (cartItemIndex !== -1) {
      const currentQuantity = user.cartItems[cartItemIndex].quantity;

      // Check if adding one more exceeds stock
      if (currentQuantity + 1 > product.stockQuantity) {
        return sendResponse(res, 400, "Failed", {
          message: `Only ${
            product.stockQuantity - currentQuantity
          } item(s) left in stock for this product.`,
        });
      }

      // If stock is available, increment quantity
      updateQuery = {
        $set: {
          [`cartItems.${cartItemIndex}.quantity`]: currentQuantity + 1,
        },
      };
      message = "Item quantity incremented successfully";
    } else {
      // If new product being added, make sure there's at least 1 in stock
      if (product.stockQuantity < 1) {
        return sendResponse(res, 400, "Failed", {
          message: "This product is currently out of stock.",
        });
      }

      updateQuery = {
        $push: { cartItems: { productId, quantity: 1 } },
      };
      message = "Item added successfully to cart";
    }

    await User.findByIdAndUpdate(currentUserId, updateQuery, { new: true });

    sendResponse(res, 200, "Success", { message });
  } catch (error) {
    console.log(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});

userController.post("/remove-from-cart/:id", auth, async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { userId: currentUserId } = req.body;

    if (!productId || !currentUserId) {
      return sendResponse(res, 422, "Failed", {
        message: "Missing productId or userId!",
      });
    }

    const user = await User.findById(currentUserId);
    if (!user) {
      return sendResponse(res, 400, "Failed", { message: "User not found!" });
    }

    // Check if product exists in cart
    const cartItem = user.cartItems.find(
      (item) => item.productId.toString() === productId
    );

    if (!cartItem) {
      return sendResponse(res, 400, "Failed", { message: "Item not in cart!" });
    }

    let updateQuery, message;

    if (cartItem.quantity > 1) {
      // Reduce quantity if more than 1
      updateQuery = {
        $set: {
          "cartItems.$[elem].quantity": cartItem.quantity - 1,
        },
      };
      message = "Item quantity decreased";

      // Update user document with array filter
      await User.findByIdAndUpdate(currentUserId, updateQuery, {
        new: true,
        arrayFilters: [{ "elem.productId": productId }],
      });
    } else {
      // Remove item from cart if quantity is 1
      updateQuery = {
        $pull: { cartItems: { productId } },
      };
      message = "Item removed from cart";

      // Update user document without array filter
      await User.findByIdAndUpdate(currentUserId, updateQuery, { new: true });
    }

    sendResponse(res, 200, "Success", { message });
  } catch (error) {
    console.log(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});

userController.get("/cart/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return sendResponse(res, 422, "Failed", {
        message: "User ID is required!",
      });
    }

    const user = await User.findById(userId).populate({
      path: "cartItems.productId",
      populate: { path: "categoryId" },
    });

    if (!user) {
      return sendResponse(res, 400, "Failed", {
        message: "User not found!",
      });
    }

    let actualTotalAmount = 0;
    let discountedTotalAmount = 0;

    const cartDetails = user.cartItems
      .map((item) => {
        const product = item.productId;

        if (!product) {
          return null; // skip this cart item if product is not found
        }

        const quantity = item.quantity || 1;
        const price = product.price;
        const discounted_price = product.discountedPrice;

        const actualPrice = price * quantity;
        const discountedPrice = discounted_price * quantity;
        actualTotalAmount += actualPrice;
        discountedTotalAmount += discountedPrice;

        return {
          _id: product._id,
          name: product.name,
          productHeroImage: product.productHeroImage,
          productGallery: product.productGallery,
          shortDescription: product.shortDescription,
          categoryId: product.categoryId,
          subCategoryId: product.subCategoryId,
          price: product.price || 0,
          discountedPrice: product.discountedPrice || 0,
          description: product.description,
          codAvailable: product.codAvailable,
          isActive: product.isActive,
          updatedAt: product.updatedAt,
          createdAt: product.createdAt,
          quantity,
          totalItemPrice: actualPrice,
          totalItemDiscountedPrice: discountedPrice,
        };
      })
      .filter(Boolean); // remove null values if any product was missing

    sendResponse(res, 200, "Success", {
      message: "Cart items retrieved successfully",
      cartItems: cartDetails,
      actualTotalAmount,
      discountedTotalAmount,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});

userController.post("/add-to-wishlist/:id", auth, async (req, res) => {
  try {
    if (!req.params.id) {
      return sendResponse(res, 422, "Failed", {
        message: "Params not found!",
      });
    }

    const productId = req.params.id;
    const currentUserId = req.body.userId;

    const product = await Product.findOne({ _id: productId });
    if (!product) {
      return sendResponse(res, 400, "Failed", {
        message: "Product not found!",
      });
    }
    const user = await User.findOne({ _id: currentUserId });
    if (!user) {
      return sendResponse(res, 400, "Failed", {
        message: "User not found!",
      });
    }

    let message, updateQuery;
    if (user.wishListItems.includes(productId)) {
      updateQuery = { $pull: { wishListItems: productId } };
      message = "Item removed successfully";
    } else {
      updateQuery = { $push: { wishListItems: productId } };
      message = "Item added successfully";
    }

    // Update the post document with the new array
    await User.findOneAndUpdate({ _id: currentUserId }, updateQuery);

    sendResponse(res, 200, "Success", {
      message: message,
    });
  } catch (error) {
    console.log(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});

userController.get("/wishlist/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return sendResponse(res, 422, "Failed", {
        message: "User ID is required!",
      });
    }

    const user = await User.findById(userId).populate("wishListItems");

    if (!user) {
      return sendResponse(res, 400, "Failed", {
        message: "User not found!",
      });
    }

    sendResponse(res, 200, "Success", {
      message: "Wishlist items retrieved successfully",
      data: user.wishListItems, // Returns the list of products in the wishlist
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});

userController.put(
  "/update",
  auth,
  upload.single("profilePic"),
  async (req, res) => {
    try {
      const id = req.body.id;
      const userData = await User.findOne({ _id: id });
      if (!userData) {
        return sendResponse(res, 404, "Failed", {
          message: "User not found",
        });
      }

      let updatedData = { ...req.body };

      if (req.file) {
        const profilePic = await cloudinary.uploader.upload(req.file.path);
        updatedData.profilePic = profilePic.url;
      }
      updatedData.profileStatus = "completed";
      const updatedUser = await User.findByIdAndUpdate(id, updatedData, {
        new: true, // Return the updated document
      });

      const io = req.io;
      io.emit("user-updated", updatedUser);

      sendResponse(res, 200, "Success", {
        message: "User updated successfully!",
        data: updatedUser,
        statusCode: 200,
      });
    } catch (error) {
      console.error(error);
      sendResponse(res, 500, "Failed", {
        message: error.message || "Internal server error",
      });
    }
  }
);

userController.post("/home-details", async (req, res) => {
  try {
    const homeCategory = await Category.find({});
    const bestSellerSubCategory = await SubCategory.find({});
    const homeSubCategory = await SubCategory.find({});
    const trendingProducts = await Product.find({specialApperence:"Trending"});
    const bestSellerProducts = await Product.find({specialApperence:"Best Seller"});
    sendResponse(res, 200, "Success", {
      message: "Home page data fetched successfully!",
      data: {
        homeCategory,
        bestSellerSubCategory,
        homeSubCategory,
        trendingProducts,
        bestSellerProducts,
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

userController.post("/remove-all-from-cart/:id", auth, async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { userId: currentUserId } = req.body;

    if (!productId || !currentUserId) {
      return sendResponse(res, 422, "Failed", {
        message: "Missing productId or userId!",
      });
    }

    const user = await User.findById(currentUserId);
    if (!user) {
      return sendResponse(res, 400, "Failed", { message: "User not found!" });
    }

    const cartItem = user.cartItems.find(
      (item) => item.productId.toString() === productId
    );

    if (!cartItem) {
      return sendResponse(res, 400, "Failed", { message: "Item not in cart!" });
    }

    // ✅ Remove the product entirely from the cart (regardless of quantity)
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { cartItems: { productId } },
    });

    return sendResponse(res, 200, "Success", {
      message: "Product removed from cart",
    });
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});

userController.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return sendResponse(res, 404, "Failed", {
        message: "User not found",
        statusCode:400
      });
    }
    await User.findByIdAndDelete(id);
    sendResponse(res, 200, "Success", {
      message: "User deleted successfully!",
      statusCode:200
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});

userController.get("/dashboard-details", async (req, res) => {
  try {
    // Parallel data fetching
    const [
      totalUser,
      activeUser,
      inactiveUser,
      totalBooking,
      activeBooking,
      bookingCompleted,
      totalProduct,
      activeProduct,
      inactiveProduct,
      totalDriver,
      activeDriver,
      inactiveDriver,
      totalVendor,
      activeVendor,
      inactiveVendor,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ profileStatus: "completed" }),
      User.countDocuments({ profileStatus: "incompleted" }),
      Booking.countDocuments(),
      Booking.countDocuments({
        status: { $in: ["orderPlaced", "orderPacked", "outForDelivery"] },
      }),
      Booking.countDocuments({ status: "completed" }),
      Product.countDocuments(),
      Product.countDocuments({ status: true }),
      Product.countDocuments({ status: false }),
      Driver.countDocuments(),
      Driver.countDocuments({ profileStatus: "completed" }),
      Driver.countDocuments({ profileStatus: "incompleted" }),
      Vendor.countDocuments(),
      Vendor.countDocuments({ profileStatus: "completed" }),
      Vendor.countDocuments({ profileStatus: "incompleted" }),
    ]);

    // Fund data
    const fundData = await Fund.findOne();
    const totalEarning = fundData ? fundData.totalEarning : 0;
    const currentWallet = fundData ? fundData.wallet : 0;

    // Last 15 days booking stats
    const last15Days = await Booking.aggregate([
      {
        $match: {
          createdAt: {
            $gte: moment().subtract(15, "days").startOf("day").toDate(),
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          noOfBookings: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Construct array for chart display
    const bookingsLast15Days = [];
    for (let i = 14; i >= 0; i--) {
      const dateObj = moment().subtract(i, "days");
      const formattedDate = dateObj.format("Do MMM");
      const mongoDate = dateObj.format("YYYY-MM-DD");

      const bookingData = last15Days.find((b) => b._id === mongoDate);

      bookingsLast15Days.push({
        date: formattedDate,
        noOfBookings: bookingData ? bookingData.noOfBookings : 0,
        mongoDate,
      });
    }

    // Final response
    sendResponse(res, 200, "Success", {
      message: "Dashboard details retrieved successfully",
      data: {
        users: { totalUser, activeUser, inactiveUser },
        bookings: { totalBooking, activeBooking, bookingCompleted },
        products: {
          totalProduct,
          activeProduct,
          inactiveProduct,
        },
        drivers: { totalDriver, activeDriver, inactiveDriver },
        vendors: { totalVendor, activeVendor, inactiveVendor },
        earnings: { totalEarning, currentWallet },
        last15DaysBookings: bookingsLast15Days,
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

module.exports = userController;
