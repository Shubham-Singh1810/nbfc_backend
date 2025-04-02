const express = require("express");
const { sendResponse, generateOTP } = require("../utils/common");
require("dotenv").config();
const User = require("../model/user.Schema");
const Product = require("../model/product.Schema");
const userController = express.Router();
const axios = require("axios");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");

userController.post("/send-otp", async (req, res) => {
  try {
    const {phone, ...otherDetails} = req.body;
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
      const token = jwt.sign({ userId: user._id, phone: user.phone }, process.env.JWT_KEY);
      // Store the token in the user object or return it in the response
      user.token = token;
      user = await User.findByIdAndUpdate(user.id, { token }, { new: true });
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
      }&company=Acediva&otp=${phoneOtp}&message=${encodeURIComponent(otpMessage)}`
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


userController.post("/sign-up", upload.fields([{ name: "profilePic", maxCount: 1 }]), async (req, res) => {
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
        let image = await cloudinary.uploader.upload(req.files["profilePic"][0].path);
        profilePic = image.url;
      }
  
      // Create a new user with provided details
      let newUser = await User.create({ 
        ...req.body, 
        phoneOtp: otp, 
        profilePic
      });
  
      // Generate JWT token
      const token = jwt.sign({ userId: newUser._id, phone: newUser.phone }, process.env.JWT_KEY);
  
      // Store the token in the user object or return it in the response
      newUser.token = token;
      const updatedUser = await User.findByIdAndUpdate(newUser._id, { token }, { new: true });
  
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
});
  

userController.post("/otp-verification", async (req, res) => {
  try {
    const { phone, phoneOtp } = req.body;
    const user = await User.findOne({ phone, phoneOtp });
    if (user) {
        const updatedUser = await User.findByIdAndUpdate(user._id, { isPhoneVerified:true, profileStatus:"completed" }, { new: true });
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
        const updatedUser = await User.findByIdAndUpdate(user._id, { phoneOtp:otp }, { new: true });
  
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


userController.get("/details/:id", async (req, res) => {
    try {
        const id = req.params.id
      const user = await User.findOne({_id:id});
      if(user){
        return sendResponse(res, 200, "Success", {
            message: "User details fetched  successfully",
            data: user,
            statusCode: 200,
          });
      }else{
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


userController.post("/add-to-cart/:id", async (req, res) => {
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
    } const user = await User.findOne({ _id: currentUserId });
    if (!user) {
      return sendResponse(res, 400, "Failed", {
        message: "User not found!",
      });
    }


    let message, updateQuery;
    if (user.cartItems.includes(productId)) {
      updateQuery = { $pull: { cartItems: productId } }; 
      message = "Item removed successfully";
    } else {
      updateQuery = { $push: { cartItems: productId } }; 
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


userController.post("/add-to-wishlist/:id", async (req, res) => {
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
    } const user = await User.findOne({ _id: currentUserId });
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


module.exports = userController;
