const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const Admin = require("../model/admin.Schema");
const adminController = express.Router();
require("dotenv").config();
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

adminController.post("/create", async (req, res) => {
  try {
    let { password, ...rest } = req.body;

    // password encrypt karo
    const hashedPassword = await bcrypt.hash(password, 10);

    const AdminData = await Admin.create({
      ...rest,
      password: hashedPassword,
    });

    // Generate JWT token
          const token = jwt.sign(
            { userId: AdminData._id, phone: AdminData.phone },
            process.env.JWT_KEY
          );
    
          // Store the token in the user object or return it in the response
          AdminData.token = token;
          const updatedAdmin = await Admin.findByIdAndUpdate(
            AdminData._id,
            { token },
            { new: true }
          );

    sendResponse(res, 200, "Success", {
      message: "Admin created successfully!",
      data: updatedAdmin,
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


adminController.put("/update", async (req, res) => {
  try {
    const AdminData = await Admin.findByIdAndUpdate(req?.body?._id, req.body, {
      new: true,
    });
    sendResponse(res, 200, "Success", {
      message: "Admin updated successfully!",
      data: AdminData,
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

adminController.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await Admin.findById(id);
    if (!admin) {
      return sendResponse(res, 404, "Failed", {
        message: "Admin not found",
      });
    }

    await Admin.findByIdAndDelete(id);
    sendResponse(res, 200, "Success", {
      message: "Admin deleted successfully!",
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});

adminController.post("/login", async (req, res) => {
  try {
    const { email, password, deviceId } = req.body;

    if (!email || !password) {
      return sendResponse(res, 400, "Failed", {
        message: "Email/Phone and Password are required",
        statusCode: 400,
      });
    }
    let query = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(email)) {
      query.email = email;
    } else {
      query.phone = email; 
    }
    const user = await Admin.findOne(query);
    if (!user) {
      return sendResponse(res, 422, "Failed", {
        message: "Invalid Credentials",
        statusCode: 422,
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendResponse(res, 422, "Failed", {
        message: "Invalid Credentials",
        statusCode: 422,
      });
    }
    let updatedAdmin = await Admin.findByIdAndUpdate(
      user._id,
      { deviceId },
      { new: true }
    );

    return sendResponse(res, 200, "Success", {
      message: "Admin logged in successfully",
      data: updatedAdmin,
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

adminController.post("/list", async (req, res) => {
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

    // Construct sorting object
    const sortField = sortByField || "createdAt";
    const sortOrder = sortByOrder === "asc" ? 1 : -1;
    const sortOption = { [sortField]: sortOrder };

    // Fetch the category list
    const adminList = await Admin.find(query)
      .sort(sortOption)
      .limit(parseInt(pageCount))
      .skip(parseInt(pageNo - 1) * parseInt(pageCount))
      .populate({
        path: "role",
      });
    const totalCount = await Admin.countDocuments({});
    sendResponse(res, 200, "Success", {
      message: "Admin list retrieved successfully!",
      data: adminList,
      documentCount: {
        totalCount,
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


module.exports = adminController;
