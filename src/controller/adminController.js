const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const Admin = require("../model/admin.Schema");
const adminController = express.Router();
require("dotenv").config();
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");

adminController.post("/create", upload.single("profilePic"), async (req, res) => {
  try {
    let obj;
    if (req.file) {
      let image = await cloudinary.uploader.upload(req.file.path, function (err, result) {
        if (err) {
          return err;
        } else {
          return result;
        }
      });
      obj = { ...req.body, profilePic: image.url };
    }
    const AdminData = await Admin.create(obj);
    sendResponse(res, 200, "Success", {
      message: "Admin created successfully!",
      data: AdminData,
      statusCode:200
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
      statusCode:500
    });
  }
});

adminController.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await Admin.findOne({ email, password });
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
module.exports = adminController;
