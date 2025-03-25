const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const AttributeSet = require("../model/attributeSet.Schema");
const attributeSetController= express.Router();
require("dotenv").config();
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");



attributeSetController.post("/create", upload.single("image"), async (req, res) => {
  try {
    let obj;
    if (req.file) {
      let image = await cloudinary.uploader.upload(req.file.path, function (err, result) {
        if (err) {
          return err;
        } else {
          return result;
        }
      });
      obj = { ...req.body, image: image.url };
    }
    const AttributeSetCreated = await AttributeSet.create(obj);
    sendResponse(res, 200, "Success", {
      message: "Attribute created successfully!",
      data: AttributeSetCreated,
      statusCode: 200
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
      statusCode: 500
    });
  }
});


attributeSetController.post("/list", async (req, res) => {
  try {
    const {
      searchKey = "",
      status,
      pageNo = 1,
      pageCount = 10,
      sortByField,
      sortByOrder
    } = req.body;
    const query = {};
    if (status) query.status = status;
    if (searchKey) query.name = { $regex: searchKey, $options: "i" };
    const sortField = sortByField || "createdAt";
    const sortOrder = sortByOrder === "asc" ? 1 : -1;
    const sortOption = { [sortField]: sortOrder };
    const attributeSetList = await AttributeSet.find(query)
      .sort(sortOption)
      .limit(parseInt(pageCount))
      .skip(parseInt(pageNo - 1) * parseInt(pageCount));
    const totalCount = await AttributeSet.countDocuments({});
    const activeCount = await AttributeSet.countDocuments({ status: true });
    sendResponse(res, 200, "Success", {
      message: "Attribute list retrieved successfully!",
      data: attributeSetList,
      documentCount: { totalCount, activeCount, inactiveCount: totalCount - activeCount },
      statusCode: 200
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
      statusCode: 500
    });
  }
});


attributeSetController.put("/update", upload.single("image"), async (req, res) => {
  try {
    const id = req.body._id;
    const attributeSet = await AttributeSet.findById(id);
    if (!attributeSet) {
      return sendResponse(res, 404, "Failed", {
        message: "Attribute set not found",
        statusCode: 403
      });
    }
    let updatedData = { ...req.body };
    if (req.file) {
      // Delete the old image from Cloudinary
      if (attributeSet.image) {
        const publicId = attributeSet.image.split("/").pop().split(".")[0];
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
    const updatedAttributeSet = await AttributeSet.findByIdAndUpdate(id, updatedData, {
      new: true, // Return the updated document
    });
    sendResponse(res, 200, "Success", {
      message: "Attribute set updated successfully!",
      data: updatedAttributeSet,
      statusCode: 200
    });
  } catch (error) {
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
      statusCode: 500
    });
  }
});


attributeSetController.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const attributeSet = await AttributeSet.findById(id);
    if (!attributeSet) {
      return sendResponse(res, 404, "Failed", {
        message: "Attribute set not found",
      });
    }
    const imageUrl = attributeSet.image;
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
    await AttributeSet.findByIdAndDelete(id);
    sendResponse(res, 200, "Success", {
      message: "Attribute set associated image deleted successfully!",
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});


attributeSetController.get("/details/:id", async (req, res) => {
  try {
    const { id } = req.params
    const attributeSetDetails = await AttributeSet.findOne({ _id: id });
    sendResponse(res, 200, "Success", {
      message: "Attributeset retrived successfully!",
      data: { attributeSetDetails },
      statusCode: 200
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
      statusCode: 500
    });
  }
});


module.exports = attributeSetController;