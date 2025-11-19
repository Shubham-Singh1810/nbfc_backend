const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const LoanPurpose = require("../model/loanPurpose.Schema");
const loanPurposeController = express.Router();
require("dotenv").config();
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");

loanPurposeController.post(
  "/create",
  upload.single("img"),
  async (req, res) => {
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
        obj = { ...req.body, img: image.url };
      }
      const loanPurposeCreated = await LoanPurpose.create(obj);
      sendResponse(res, 200, "Success", {
        message: "Loan purpose created successfully!",
        data: loanPurposeCreated,
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

loanPurposeController.post("/list", async (req, res) => {
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
    if (status) query.status = status;
    if (searchKey) query.name = { $regex: searchKey, $options: "i" };
    const sortField = sortByField || "createdAt";
    const sortOrder = sortByOrder === "asc" ? 1 : -1;
    const sortOption = { [sortField]: sortOrder };
    const loanPurposeList = await LoanPurpose.find(query)
      .sort(sortOption)
      .limit(parseInt(pageCount))
      .skip(parseInt(pageNo - 1) * parseInt(pageCount));
    const totalCount = await LoanPurpose.countDocuments({});
    const activeCount = await LoanPurpose.countDocuments({ status: true });
    sendResponse(res, 200, "Success", {
      message: "Loan purpose list retrieved successfully!",
      data: loanPurposeList,
      documentCount: {
        totalCount,
        activeCount,
        inactiveCount: totalCount - activeCount,
      },
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

loanPurposeController.put(
  "/update",
  upload.single("img"),
  async (req, res) => {
    try {
      const id = req.body._id;

      const loanPurpose = await LoanPurpose.findById(id);
      if (!loanPurpose) {
        return sendResponse(res, 404, "Failed", {
          message: "Loan purpose not found",
          statusCode: 403,
        });
      }

      let updateData = { ...req.body };

      // If new image is uploaded
      if (req.file) {
        const image = await cloudinary.uploader.upload(req.file.path);
        updateData.img = image.secure_url; // update image URL
      }

      const updatedDocument = await LoanPurpose.findByIdAndUpdate(
        id,
        updateData,
        {
          new: true,
        }
      );

      sendResponse(res, 200, "Success", {
        message: "Loan purpose updated successfully!",
        data: updatedDocument,
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


loanPurposeController.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const document = await LoanPurpose.findById(id);
    if (!document) {
      return sendResponse(res, 404, "Failed", {
        message: "Loan purpose not found",
        statusCode: 404,
      });
    }
    await LoanPurpose.findByIdAndDelete(id);
    sendResponse(res, 200, "Success", {
      message: "Loan purpose deleted successfully!",
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

module.exports = loanPurposeController;
