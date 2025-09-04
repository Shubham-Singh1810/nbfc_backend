const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const Document = require("../model/tag.Schema");
const documentController = express.Router();
require("dotenv").config();
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");

documentController.post("/create", async (req, res) => {
  try {
    const documentCreated = await Document.create(req.body);
    sendResponse(res, 200, "Success", {
      message: "Document created successfully!",
      data: documentCreated,
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

documentController.post("/list", async (req, res) => {
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
    const documentList = await Document.find(query)
      .sort(sortOption)
      .limit(parseInt(pageCount))
      .skip(parseInt(pageNo - 1) * parseInt(pageCount));
    const totalCount = await Document.countDocuments({});
    const activeCount = await Document.countDocuments({ status: true });
    sendResponse(res, 200, "Success", {
      message: "Document list retrieved successfully!",
      data: documentList,
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

documentController.put("/update", async (req, res) => {
  try {
    const id = req.body._id;
    const document = await Document.findById(id);
    if (!document) {
      return sendResponse(res, 404, "Failed", {
        message: "Document not found",
        statusCode: 403,
      });
    }
    const updatedDocument = await Document.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true, // Return the updated document
      }
    );
    sendResponse(res, 200, "Success", {
      message: "Document updated successfully!",
      data: updatedDocument,
      statusCode: 200,
    });
  } catch (error) {
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
      statusCode: 500,
    });
  }
});

documentController.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Document.findById(id);
    if (!document) {
      return sendResponse(res, 404, "Failed", {
        message: "Document not found",
        statusCode: 404,
      });
    }
    await Document.findByIdAndDelete(id);
    sendResponse(res, 200, "Success", {
      message: "Document deleted successfully!",
      statusCode:200
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
      statusCode: 500,   
    });
  }
});



module.exports = documentController;
