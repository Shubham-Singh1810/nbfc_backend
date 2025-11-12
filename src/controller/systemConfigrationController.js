const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const SystemConfigration = require("../model/systemConfigration.Schema");
const systemConfigrationController = express.Router();
require("dotenv").config();

systemConfigrationController.get("/details", async (req, res) => {
  try {
    const SystemDetails = await SystemConfigration.findOne({});
    sendResponse(res, 200, "Success", {
      message: "System details retrived successfully",
      data: SystemDetails,
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

systemConfigrationController.post("/add-details", async (req, res) => {
  try {
    const SystemDetails = await SystemConfigration.create(req.body);
    sendResponse(res, 200, "Success", {
      message: "System configration created successfully",
      data: SystemDetails,
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

systemConfigrationController.put("/update-details", async (req, res) => {
  try {
    const systemConfigrationData = await SystemConfigration.findOne({});
    if (!systemConfigrationData) {
      return sendResponse(res, 404, "Failed", {
        message: "System configration not found",
        statusCode: 403,
      });
    }
    const updateSystemConfigration = await SystemConfigration.findByIdAndUpdate(systemConfigrationData?._id, req.body, {
      new: true,
    });

    sendResponse(res, 200, "Success", {
      message: "System configration successfully!",
      data: updateSystemConfigration,
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

module.exports = systemConfigrationController;
