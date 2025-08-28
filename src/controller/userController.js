const express = require("express");
const { sendResponse, generateOTP } = require("../utils/common");
require("dotenv").config();
const User = require("../model/user.Schema");
const Vendor = require("../model/vender.Schema");
const Fund = require("../model/adminFund.Schema");
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
const { sendMail } = require("../utils/common");
const bcrypt = require("bcryptjs");

userController.post("/login-with-otp", async (req, res) => {
  try {
    const { phone, ...otherDetails } = req.body;

    if (!phone) {
      return sendResponse(res, 400, "Failed", {
        message: "Phone or Email is required.",
        statusCode: 400,
      });
    }

    // Generate OTP
    const otp = generateOTP();

    // Detect if input is email or phone
    const isEmail = /\S+@\S+\.\S+/.test(phone); // simple regex for email
    const query = isEmail ? { email: phone } : { phone };

    // Find existing user
    let user = await User.findOne(query);

    if (!user) {
      // Create a new user with provided details and OTP
      user = await User.create({
        ...otherDetails,
        phone: isEmail ? undefined : phone,
        email: isEmail ? phone : undefined,
        phoneOtp: isEmail ? undefined : otp,
        emailOtp: isEmail ? otp : undefined,
      });

      // Generate JWT token for new user
      const token = jwt.sign(
        { userId: user._id, phone: user.phone, email: user.email },
        process.env.JWT_KEY
      );

      user.token = token;
      const superAdmin = await Admin.findOne();

      user = await User.findByIdAndUpdate(user._id, { token }, { new: true });

      // Send notification to admin
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
      // Update OTP in existing user
      user = await User.findByIdAndUpdate(
        user._id,
        isEmail ? { emailOtp: otp } : { phoneOtp: otp },
        { new: true }
      );
    }

    // Send OTP based on type
    if (isEmail) {
      // Send OTP to Email
      await sendMail(
        phone,
        `The OTP code is ${otp}. Do not share it with anyone.`
      );

      return sendResponse(res, 200, "Success", {
        message: "OTP sent successfully on email",
        data: user,
        statusCode: 200,
      });
    } else {
      // Send OTP to Phone
      const appHash = "ems/3nG2V1H";
      const otpMessage = `<#> ${otp} is your OTP for verification. Do not share it with anyone.\n${appHash}`;

      let optResponse = await axios.post(
        `https://api.authkey.io/request?authkey=${
          process.env.AUTHKEY_API_KEY
        }&mobile=${phone}&country_code=91&sid=${
          process.env.AUTHKEY_SENDER_ID
        }&company=Acediva&otp=${otp}&message=${encodeURIComponent(otpMessage)}`
      );

      if (optResponse?.status == "200") {
        return sendResponse(res, 200, "Success", {
          message: "OTP sent successfully on phone",
          data: user,
          statusCode: 200,
        });
      } else {
        return sendResponse(res, 422, "Failed", {
          message: "Unable to send OTP on phone",
          statusCode: 422,
        });
      }
    }
  } catch (error) {
    console.error("Error in /login-with-otp:", error.message);
    return sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error.",
    });
  }
});

userController.post("/sign-up", async (req, res) => {
  try {
    // Check if the phone number is unique
    const existingUser = await User.findOne({
      $or: [{ phone: req.body.phone }, { email: req.body.email }],
    });
    if (existingUser) {
      if (existingUser.phone === req.body.phone) {
        return sendResponse(res, 400, "Failed", {
          message: "Phone Number is already registered",
          statusCode: 400,
        });
      }
      if (existingUser.email === req.body.email) {
        return sendResponse(res, 400, "Failed", {
          message: "Email is already registered",
          statusCode: 400,
        });
      }
    }

    // ----------- Generate User Code -----------
    const year = new Date().getFullYear().toString().slice(-2); // last 2 digits
    // last user of same year
    const lastUser = await User.findOne({ code: { $regex: `^RL${year}` } })
      .sort({ createdAt: -1 });

    let count = 1;
    if (lastUser && lastUser.code) {
      const lastCount = parseInt(lastUser.code.slice(4)); // RL{yy}{count}
      count = lastCount + 1;
    }

    const paddedCount = String(count).padStart(3, "0"); // 001, 002
    const userCode = `RL${year}${paddedCount}`;
    // ------------------------------------------

    // Generate OTP
    const phoneOtp = generateOTP();
    const emailOtp = generateOTP();
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // Create a new user with provided details
    let newUser = await User.create({
      ...req.body,
      phoneOtp,
      emailOtp,
      password: hashedPassword,
      code: userCode, // <-- add this
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, phone: newUser.phone },
      process.env.JWT_KEY
    );

    // Store the token in the user object
    newUser.token = token;
    const updatedUser = await User.findByIdAndUpdate(
      newUser._id,
      { token },
      { new: true }
    );

    // Send OTP to phone
    const appHash = "ems/3nG2V1H";
    const otpMessage = `<#> ${phoneOtp} is your OTP for verification. Do not share it with anyone.\n${appHash}`;

    let phoneOtpResponse = await axios.post(
      `https://api.authkey.io/request?authkey=${
        process.env.AUTHKEY_API_KEY
      }&mobile=${req.body.phone}&country_code=91&sid=${
        process.env.AUTHKEY_SENDER_ID
      }&company=Acediva&otp=${phoneOtp}&message=${encodeURIComponent(
        otpMessage
      )}`
    );

    const emailOtpResponse = await sendMail(
      req.body.email,
      "The OTP verification code is " + emailOtp + " for email verification."
    );

    if (phoneOtpResponse?.status == "200") {
      return sendResponse(res, 200, "Success", {
        message: "OTP sent successfully on phone",
        data: updatedUser,
        statusCode: 200,
      });
    }
    if (emailOtpResponse?.status == "200") {
      return sendResponse(res, 200, "Success", {
        message: "OTP sent successfully on email",
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
});


userController.post("/otp-verification", async (req, res) => {
  try {
    const { phone, otp } = req.body;
    let query = {};
    let updateData = {};

    // Email regex check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (emailRegex.test(phone)) {
      query.email = phone;
      query.emailOtp = otp;
      updateData.isEmailVerified = true;
    } else {
      query.phone = phone;
      query.phoneOtp = otp;
      updateData.isPhoneVerified = true;
    }
    const user = await User.findOne(query);
    if (user) {
      if (
        user?.toObject().isEmailVerified &&
        user?.toObject().isPhoneVerified
      ) {
        updateData.profileStatus = "verified";
      }
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { $set: updateData },
        { new: true }
      );

      return sendResponse(res, 200, "Success", {
        message: "OTP verified successfully",
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

userController.post("/password-login", async (req, res) => {
  try {
    const { email, password, deviceId } = req.body;

    let query = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(email)) {
      query.email = email;
    } else {
      query.phone = email;
    }
    const user = await User.findOne(query);
    if (!user) {
      return sendResponse(res, 422, "Failed", {
        message: "Invalid Credentials",
        statusCode: 422,
      });
    }

    // Step 2: Compare entered password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendResponse(res, 422, "Failed", {
        message: "Invalid Credentials",
        statusCode: 422,
      });
    }
    let updatedUser = await User.findByIdAndUpdate(
      user._id,
      { deviceId },
      { new: true }
    );
    return sendResponse(res, 200, "Success", {
      message: "User logged in successfully",
      data: updatedUser,
      statusCode: 200,
    });
  } catch (error) {
    return sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error.",
      statusCode: 500,
    });
  }
});

userController.post("/resend-otp", async (req, res) => {
  try {
    const { phone } = req.body; // yahan phone field me ya to phone number hoga ya email
    if (!phone) {
      return sendResponse(res, 400, "Failed", {
        message: "Phone or Email is required",
        statusCode: 400,
      });
    }

    // Detect input type
    const isEmail = /\S+@\S+\.\S+/.test(phone);
    const query = isEmail ? { email: phone } : { phone };

    let user = await User.findOne(query);

    if (!user) {
      return sendResponse(res, 422, "Failed", {
        message: isEmail
          ? "Email is not registered"
          : "Phone number is not registered",
        statusCode: 422,
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const updateField = isEmail ? { emailOtp: otp } : { phoneOtp: otp };

    const updatedUser = await User.findByIdAndUpdate(user._id, updateField, {
      new: true,
    });

    if (isEmail) {
      // Send OTP to email
      await sendMail(
        phone,
        `The OTP code is ${otp}. Do not share it with anyone.`
      );

      return sendResponse(res, 200, "Success", {
        message: "OTP sent successfully on email",
        data: updatedUser,
        statusCode: 200,
      });
    } else {
      // Send OTP to phone
      const appHash = "ems/3nG2V1H";
      const otpMessage = `<#> ${otp} is your OTP for verification. Do not share it with anyone.\n${appHash}`;

      let otpResponse = await axios.post(
        `https://api.authkey.io/request?authkey=${
          process.env.AUTHKEY_API_KEY
        }&mobile=${phone}&country_code=91&sid=${
          process.env.AUTHKEY_SENDER_ID
        }&company=Acediva&otp=${otp}&message=${encodeURIComponent(otpMessage)}`
      );

      if (otpResponse?.status == "200") {
        return sendResponse(res, 200, "Success", {
          message: "OTP sent successfully on phone",
          data: updatedUser,
          statusCode: 200,
        });
      } else {
        return sendResponse(res, 422, "Failed", {
          message: "Unable to send OTP on phone",
          statusCode: 422,
        });
      }
    }
  } catch (error) {
    return sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error.",
      statusCode: 500,
    });
  }
});

userController.get("/details/:id",  async (req, res) => {
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
    if (status) query.profileStatus = status;
    if (searchKey) {
      query.$or = [
        { firstName: { $regex: searchKey, $options: "i" } },
        { lastName: { $regex: searchKey, $options: "i" } },
        { email: { $regex: searchKey, $options: "i" } },
        { phone: { $regex: searchKey, $options: "i" } },
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

userController.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return sendResponse(res, 404, "Failed", {
        message: "User not found",
        statusCode: 400,
      });
    }
    await User.findByIdAndDelete(id);
    sendResponse(res, 200, "Success", {
      message: "User deleted successfully!",
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});



module.exports = userController;
