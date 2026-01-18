const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const notifyController = express.Router();
const Notify = require("../model/notify.Schema");
require("dotenv").config();
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");
const {
  sendEmailToUsers,
  sendSMSToUsers,
  sendPushToUsers,
} = require("../utils/notify");

notifyController.post("/create", upload.single("icon"), async (req, res) => {
  try {
    let obj = req.body;

    if (obj.notifyUserIds) {
      obj.notifyUserIds = JSON.parse(obj.notifyUserIds);
    }

    if (obj.mode) {
      obj.mode = JSON.parse(obj.mode);
    }

    if (obj.date && obj.time) {
      obj.scheduledAt = new Date(`${obj.date} ${obj.time}`);
    }

    if (req.file) {
      const icon = await cloudinary.uploader.upload(req.file.path);
      obj.icon = icon.secure_url;
    }

    let notifyCreated = await Notify.create(obj);
    if (obj.isScheduled=="false") {
      if (obj.mode.includes("email")) {
        sendEmailToUsers(obj.notifyUserIds, obj.title, obj.subTitle, obj.icon);
      }
      if (obj.mode.includes("text")) {
        sendSMSToUsers(obj.notifyUserIds, obj.title);
      }

      if (obj.mode.includes("push")) {
        sendPushToUsers(obj.notifyUserIds, obj.title, obj.subTitle, obj.icon);
      }
    }

    sendResponse(res, 200, "Success", {
      message: obj.isScheduled
        ? "Scheduled Notify created successfully!"
        : "Notify sent successfully!",
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
});

notifyController.post("/list", async (req, res) => {
  try {
    const {
      notifyUserId,
      searchKey = "",
      isScheduled,
      isDelivered,
      pageNo = 1,
      pageCount = 10,
    } = req.body;
    const query = {};

    if (notifyUserId) {
      query.notifyUserIds = notifyUserId;
    }
    if (isScheduled) {
      query.isScheduled = isScheduled;
    }
    if (isDelivered===true || isDelivered===false) {
      query.isDelivered = isDelivered;
    }
    if (searchKey) {
      query.$or = [
        { title: { $regex: searchKey, $options: "i" } },
        { subTitle: { $regex: searchKey, $options: "i" } },
      ];
    }
    const notifyList = await Notify.find(query)
      .limit(parseInt(pageCount))
      .skip(parseInt(pageNo - 1) * parseInt(pageCount));
    const totalCount = await Notify.countDocuments({ isScheduled: true });
    const activeCount = await Notify.countDocuments({
      isScheduled: true,
      isDelivered: false,
    });
    sendResponse(res, 200, "Success", {
      message: "Notify list retrieved successfully!",
      data: notifyList,
      statusCode: 200,
      documentCount: {
        totalCount,
        activeCount,
        inactiveCount: totalCount - activeCount,
      },
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
      statusCode: 500,
    });
  }
});

notifyController.put(
  "/update",
  upload.single("icon"),
  async (req, res) => {
    try {
      const id = req.body._id;

      let notify = await Notify.findById(id);
      if (!notify) {
        return sendResponse(res, 404, "Failed", {
          message: "Notify not found",
          statusCode: 403,
        });
      }

      let obj = req.body;

      // Safe JSON parsing (only when string)
      if (obj.notifyUserIds && typeof obj.notifyUserIds === "string") {
        obj.notifyUserIds = JSON.parse(obj.notifyUserIds);
      }

      if (obj.mode && typeof obj.mode === "string") {
        obj.mode = JSON.parse(obj.mode);
      }

      // scheduled date time update
      if (obj.date && obj.time) {
        obj.scheduledAt = new Date(`${obj.date} ${obj.time}`);
      }

      // icon update
      if (req.file) {
        const icon = await cloudinary.uploader.upload(req.file.path);
        obj.icon = icon.secure_url;
      }

      const updatedNotify = await Notify.findByIdAndUpdate(id, obj, {
        new: true,
      });

      return sendResponse(res, 200, "Success", {
        message: "Notification Updated Successfully!",
        data: updatedNotify,
        statusCode: 200,
      });
    } catch (error) {
      console.error(error);
      return sendResponse(res, 500, "Failed", {
        message: error.message || "Internal server error",
        statusCode: 500,
      });
    }
  }
);

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
      message: "Notification deleted successfully!",
      statusCode: "200",
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});

module.exports = notifyController;
