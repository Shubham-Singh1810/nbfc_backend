const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const notifyController = express.Router();
const Notify = require("../model/notify.Schema");
require("dotenv").config();
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");
const { sendEmailToUsers, sendSMSToUsers, sendPushToUsers } = require("../utils/notify");

notifyController.post(
  "/create",
  upload.single("icon"),
  async (req, res) => {
    try {
      let obj = req.body;

      // Parse JSON fields
      if (obj.notifyUserIds) {
        obj.notifyUserIds = JSON.parse(obj.notifyUserIds);
      }
      if (obj.mode) {
        obj.mode = JSON.parse(obj.mode);
      }

      // Handle Image upload
      if (req.file) {
        const icon = await cloudinary.uploader.upload(req.file.path);
        obj.icon = icon.secure_url;
      }

      let notifyCreated 

      // For each mode call matching function
      if (obj.mode.includes("email")) {
        sendEmailToUsers(obj.notifyUserIds, obj.title, obj.subTitle, obj.icon);
      }

      if (obj.mode.includes("text")) {
        sendSMSToUsers(obj.notifyUserIds, obj.title);
      }

      if (obj.mode.includes("push")) {
        sendPushToUsers(obj.notifyUserIds, obj.title, obj.subTitle, obj.icon);
      }

      if (obj.mode.includes("in_app")) {
       notifyCreated = await Notify.create(obj);
      }

      sendResponse(res, 200, "Success", {
        message: "Notify created successfully!",
        data: notifyCreated,
        statusCode: 200,
      });

    } catch (error) {
      console.error(error);
      sendResponse(res, 500, "Failed", {
        message: error.message || "Internal server error",
        statusCode: 500,
      });
    }
  }
);


notifyController.post("/list", async (req, res) => {
  try {
    const { notifyUserId, isRead, pageNo = 1, pageCount = 10 } = req.body;
    const query = {};

    if (notifyUserId) {
      query.notifyUserIds = notifyUserId;
    }
    if (isRead) {
      query.isRead = isRead;
    }
    const notifyList = await Notify.find(query)

      .limit(parseInt(pageCount))
      .skip(parseInt(pageNo - 1) * parseInt(pageCount));

    sendResponse(res, 200, "Success", {
      message: "Notify list retrieved successfully!",
      data: notifyList,
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

notifyController.put("/update", async (req, res) => {
  try {
    const id = req.body._id;
    const notify = await Notify.findById(id);
    if (!notify) {
      return sendResponse(res, 404, "Failed", {
        message: "Notify not found",
        statusCode: 403,
      });
    }
    const updatedNotify = await Notify.findByIdAndUpdate(id, req.body, {
      new: true, // Return the updated document
    });
    sendResponse(res, 200, "Success", {
      message: "Mark as read!",
      data: updatedNotify,
      statusCode: 200,
    });
  } catch (error) {
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
      statusCode: 500,
    });
  }
});
notifyController.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const notify = await Notify.findById(id);
    if (!notify) {
      return sendResponse(res, 404, "Failed", {
        message: "Notify not found",
      });
    }
    const imageUrl = notify.image;
    if (imageUrl) {
      const publicId = imageUrl.split("/").pop().split(".")[0]; // Extract public ID
      // Delete the image from Cloudinary
      await cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          console.error("Error deleting image from Cloudinary:", error);
        } else {
          console.log("Cloudinary image deletion result:", result);
        }
      });
    }
    await Notify.findByIdAndDelete(id);
    sendResponse(res, 200, "Success", {
      message: "Notify and associated image deleted successfully!",
      statusCode:"200"
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});


module.exports = notifyController;
