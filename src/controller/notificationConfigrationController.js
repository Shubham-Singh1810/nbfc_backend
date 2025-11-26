const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const NotificationConfigration = require("../model/notificationConfigration.Schema");
const notificationConfigrationController = express.Router();
require("dotenv").config();

notificationConfigrationController.get("/details", async (req, res) => {
  try {
    const notificationConfigDetails = await NotificationConfigration.findOne({});
    sendResponse(res, 200, "Success", {
      message: "Notification configration details retrived successfully",
      data: notificationConfigDetails,
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

notificationConfigrationController.post("/add-details", async (req, res) => {
  try {
    const notificationConfigDetails = await NotificationConfigration.create(req.body);
    sendResponse(res, 200, "Success", {
      message: "Notification configration created successfully",
      data: notificationConfigDetails,
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

notificationConfigrationController.put("/update-details", async (req, res) => {
  try {
    const notificationConfig = await NotificationConfigration.findOne({});
    if (!notificationConfig) {
      return sendResponse(res, 404, "Failed", {
        message: "Notification configration not found",
        statusCode: 403,
      });
    }
    const updateNotificationConfigration = await NotificationConfigration.findByIdAndUpdate(notificationConfig?._id, req.body, {
      new: true,
    });

    sendResponse(res, 200, "Success", {
      message: "Notification configration updated successfully!",
      data: updateNotificationConfigration,
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

module.exports = notificationConfigrationController;
