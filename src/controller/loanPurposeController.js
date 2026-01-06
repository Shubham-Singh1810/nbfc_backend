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
      const {name} = req?.body
       const existing = await LoanPurpose.findOne({
        name: { $regex: `^${name}$`, $options: "i" }, // case-insensitive
      });

      if (existing) {
        return sendResponse(res, 400, "Failed", {
          message: "Loan purpose name already exists",
          statusCode: 400,
        });
      }
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
      const { _id, name } = req.body;

      const loanPurpose = await LoanPurpose.findById(_id);
      if (!loanPurpose) {
        return sendResponse(res, 404, "Failed", {
          message: "Loan purpose not found",
          statusCode: 404,
        });
      }

      // ✅ 1. Check duplicate name (exclude current document)
      if (name) {
        const existing = await LoanPurpose.findOne({
          name: { $regex: `^${name}$`, $options: "i" }, // case-insensitive
          _id: { $ne: _id }, // 🔥 exclude current record
        });

        if (existing) {
          return sendResponse(res, 400, "Failed", {
            message: "Loan purpose name already exists",
            statusCode: 400,
          });
        }
      }

      let updateData = { ...req.body };

      // ✅ 2. Handle image upload
      if (req.file) {
        const image = await cloudinary.uploader.upload(req.file.path);
        updateData.img = image.secure_url;
      }

      const updatedDocument = await LoanPurpose.findByIdAndUpdate(
        _id,
        updateData,
        {
          new: true,
          runValidators: true, // 🔥 important
        }
      );

      sendResponse(res, 200, "Success", {
        message: "Loan purpose updated successfully!",
        data: updatedDocument,
        statusCode: 200,
      });
    } catch (error) {
      console.error(error);

      // ✅ 3. MongoDB duplicate key fallback
      if (error.code === 11000) {
        return sendResponse(res, 400, "Failed", {
          message: "Loan purpose name already exists",
          statusCode: 400,
        });
      }

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
