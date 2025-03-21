const express = require("express");
const { sendResponse, generateOTP } = require("../utils/common");
require("dotenv").config();
const Vender = require("../model/vender.Schema");
const venderController = express.Router();
const axios = require("axios");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");


venderController.post("/sign-up", async (req, res) => {
    try {
      // Check if the phone number is unique
      const user = await Vender.findOne({ phone: req.body.phone });
      if (user) {
        return sendResponse(res, 400, "Failed", {
          message: "Vendor is already registered.",
          statusCode: 400,
        });
      }
  
      // Generate OTP
      const otp = generateOTP();

  
      // Create a new user with provided details
      let newVender = await Vender.create({ 
        ...req.body, 
        phoneOtp: otp
      });
  
      // Generate JWT token
      const token = jwt.sign({ userId: newVender._id, phone: newVender.phone }, process.env.JWT_KEY);
  
      // Store the token in the user object or return it in the response
      newVender.token = token;
      const updatedVender = await Vender.findByIdAndUpdate(newVender._id, { token }, { new: true });
  
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
          data: updatedVender,
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
  

venderController.post("/otp-verification", async (req, res) => {
  try {
    const { phone, phoneOtp } = req.body;
    const user = await Vender.findOne({ phone, phoneOtp });
    if (user) {
        const updatedVender = await Vender.findByIdAndUpdate(user._id, { isPhoneVerified:true, profileStatus:"otpVerified" }, { new: true });
      return sendResponse(res, 200, "Success", {
        message: "Otp verified successfully",
        data: updatedVender,
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


venderController.post("/login", async (req, res) => {
    try {
      const { phone, password } = req.body;
      const user = await Vender.findOne({ phone, password });
      if (user) {
        return sendResponse(res, 200, "Success", {
          message: "Vender logged in successfully",
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


venderController.post("/resend-otp", async (req, res) => {
    try {
      const { phone } = req.body;
      const user = await Vender.findOne({ phone });
      if (user) {
        const otp = generateOTP();
        const updatedVender = await Vender.findByIdAndUpdate(user._id, { phoneOtp:otp }, { new: true });
  
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
            data: updatedVender,
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


venderController.get("/details/:id", async (req, res) => {
    try {
        const id = req.params.id
      const vender = await Vender.findOne({_id:id});
      if(vender){
        return sendResponse(res, 200, "Success", {
            message: "Vender details fetched  successfully",
            data: vender,
            statusCode: 200,
          });
      }else{
        return sendResponse(res, 404, "Failed", {
            message: "Vender not found",
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


// venderController.get("/update-step2", async (req, res) => {
//   try {
//     const vender = await Vender.findOne({_id:req.body.id});
//     if(!vender){
//       return sendResponse(res, 404, "Failed", {
//           message: "Vender not found",
//           data: vender,
//           statusCode: 404,
//         });
//     }

//   } catch (error) {
//     return sendResponse(res, 500, "Failed", {
//       message: error.message || "Internal server error.",
//       statusCode: 500,
//     });
//   }
// });

module.exports = venderController;
