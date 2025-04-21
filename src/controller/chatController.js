const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const Chat = require("../model/chat.Schema");
const User = require("../model/user.Schema");         
const Vendor = require("../model/vender.Schema");
const Driver = require("../model/driver.Schema");
const Admin = require("../model/address.Schema");
const chatController = express.Router();
require("dotenv").config();
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");
const auth = require("../utils/auth");
const { isReadable } = require("stream");

chatController.post("/create", upload.single("image"), async (req, res) => {
  try {
    let obj;
    if (req.file) {
      let image = await cloudinary.uploader.upload(
        req.file.path,
        function (err, result) {
          if (err) {
            return err;
          } else {
            return result;
          }
        }
      );
      obj = { ...req.body, image: image.url };
    }
    const chatCreated = await Chat.create(obj);
    sendResponse(res, 200, "Success", {
      message: "Chat created successfully!",
      data: chatCreated,
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



chatController.post("/list/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const chatList = await Chat.find({ ticketId: id }).lean();
    const userUnreadCount = await Chat.countDocuments({
      ticketId: id,
      isRead: false,
      userType: { $ne: "Admin" },
    });
    const adminUnreadCount = await Chat.countDocuments({
      ticketId: id,
      isRead: false,
      userType: "Admin",
    });
    const populatedChats = await Promise.all(
      chatList.map(async (chat) => {
        let userDetails = null;
        if (chat.userType === "User") {
          userDetails = await User.findById(chat.userId).lean();
        } else if (chat.userType === "Vender") {
          userDetails = await Vendor.findById(chat.userId).lean();
        } else if (chat.userType === "Driver") {
          userDetails = await Driver.findById(chat.userId).lean();
        } else if (chat.userType === "Admin") {
          userDetails = await Admin.findById(chat.userId).lean();
        }
        return {
          ...chat,
          userDetails,
        };
      })
    );
    sendResponse(res, 200, "Success", {
      message: "Chat list retrieved successfully!",
      data: populatedChats,
      documentCount: {
        adminUnreadCount,
        userUnreadCount,
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


chatController.put("/update", async (req, res) => {
  try {
    const id = req.body.id;
    const chatData = await Chat.findById(id);
    if (!chatData) {
      return sendResponse(res, 404, "Failed", {
        message: "Chat not found",
      });
    }
    let updatedData = { ...req.body };
    const updatedAddress = await Chat.findByIdAndUpdate(id, updatedData, {
      new: true,
    });
    sendResponse(res, 200, "Success", {
      message: "Chat updated successfully!",
      data: updatedAddress,
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});



module.exports = chatController;
