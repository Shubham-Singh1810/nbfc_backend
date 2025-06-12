const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const WithdrawRequest = require("../model/withdrawRequest.Schema");
const Driver = require("../model/driver.Schema");
const Vender = require("../model/vender.Schema");
const withdrawRequestController = express.Router();
require("dotenv").config();
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");

withdrawRequestController.post("/create", async (req, res) => {
  try {
    const withdrawRequestCreated = await WithdrawRequest.create(req.body);
    sendResponse(res, 200, "Success", {
      message: "withdrawRequest created successfully!",
      data: withdrawRequestCreated,
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

withdrawRequestController.post("/list", async (req, res) => {
  try {
    const {
      searchKey = "",
      pageNo = 1,
      pageCount = 10,
      userId,
      status,
      userType,
    } = req.body;

    const query = {};
    if (searchKey) query.message = { $regex: searchKey, $options: "i" };
    if (userId) query.userId = userId;
    if (status) query.status = status;
    if (userType) query.userType = userType;

    const withdrawRequests = await WithdrawRequest.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(pageCount))
      .skip((parseInt(pageNo) - 1) * parseInt(pageCount));

    // ab har withdrawRequest ka user detail fetch karenge
    const finalList = [];

    for (const withdraw of withdrawRequests) {
      let userDetails = null;

      if (withdraw.userType === "Driver") {
        userDetails = await Driver.findOne(
          { _id: withdraw.userId },
          { firstName: 1,lastName:1, phone: 1, profilePic: 1 }
        );
      } else if (withdraw.userType === "Vender") {
        userDetails = await Vender.findOne(
          { _id: withdraw.userId },
          { firstName: 1,lastName:1, phone: 1, profilePic: 1 }
        );
      }

      finalList.push({
        ...withdraw.toObject(),
        userDetails: userDetails || null,
      });
    }

    sendResponse(res, 200, "Success", {
      message: "Withdraw requests retrieved successfully!",
      data: finalList,
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


withdrawRequestController.put(
  "/update",
  upload.single("image"),
  async (req, res) => {
    try {
      const id = req.body._id;
      const withdrawRequest = await WithdrawRequest.findById(id);
      if (!withdrawRequest) {
        return sendResponse(res, 404, "Failed", {
          message: "WithdrawRequest not found",
          statusCode: 403,
        });
      }
      let updatedData = { ...req.body };
      if (req.file) {
        // Delete the old image from Cloudinary
        if (withdrawRequest.image) {
          const publicId = withdrawRequest.image.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(publicId, (error, result) => {
            if (error) {
              console.error("Error deleting old image from Cloudinary:", error);
            } else {
              console.log("Old image deleted from Cloudinary:", result);
            }
          });
        }
        const image = await cloudinary.uploader.upload(req.file.path);
        updatedData.image = image.url;
      }
      const updatedwithdrawRequest = await WithdrawRequest.findByIdAndUpdate(
        id,
        updatedData,
        {
          new: true, // Return the updated document
        }
      );
      sendResponse(res, 200, "Success", {
        message: "WithdrawRequest updated successfully!",
        data: updatedwithdrawRequest,
        statusCode: 200,
      });
    } catch (error) {
      sendResponse(res, 500, "Failed", {
        message: error.message || "Internal server error",
        statusCode: 500,
      });
    }
  }
);

withdrawRequestController.get("/details/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const withdrawRequestDetails = await WithdrawRequest.findOne({ _id: id });
    sendResponse(res, 200, "Success", {
      message: "WithdrawRequest retrived successfully!",
      data: { withdrawRequestDetails },
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

module.exports = withdrawRequestController;
