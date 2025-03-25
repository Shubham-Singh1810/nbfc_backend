const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const Attribute = require("../model/attribute.Schema");
const AttributeSet = require("../model/attributeSet.Schema");
const attributeController = express.Router();
require("dotenv").config();
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");
const auth = require("../utils/auth");


attributeController.post("/create", upload.single("image"), async (req, res) => {
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
    const attributeCreated = await Attribute.create(obj);
    sendResponse(res, 200, "Success", {
      message: "Attribute created successfully!",
      data: attributeCreated,
      statusCode:200
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});


attributeController.post("/list", async (req, res) => {
  try {
    const {
      searchKey = "", 
      status, 
      pageNo=1, 
      pageCount = 10,
      sortByField, 
      sortByOrder
    } = req.body;

    
    const query = {};
    if (status) query.status = status; 
    if (searchKey) query.name = { $regex: searchKey, $options: "i" }; 

    // Construct sorting object
    const sortField = sortByField || "createdAt"; 
    const sortOrder = sortByOrder === "asc" ? 1 : -1; 
    const sortOption = { [sortField]: sortOrder };

    // Fetch the category list
    const attributeList = await Attribute.find(query)
      .sort(sortOption)
      .limit(parseInt(pageCount))
      .skip(parseInt(pageNo-1) * parseInt(pageCount))
      .populate({
        path: "attributeSetId", // Field to populate
        select: "name description", // Specify the fields to retrieve from the category collection
      })
    const totalCount = await Attribute.countDocuments({});
    const activeCount = await Attribute.countDocuments({status:true});
    sendResponse(res, 200, "Success", {
      message: "Attribute list retrieved successfully!",
      data: attributeList,
      documentCount: {totalCount, activeCount, inactiveCount: totalCount-activeCount},
      statusCode:200

    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});


attributeController.put("/update", upload.single("image"), async (req, res) => {
  try {
    const id = req.body._id;

    // Find the category by ID
    const attributeData = await Attribute.findById(id);
    if (!attributeData) {
      return sendResponse(res, 404, "Failed", {
        message: "Attribute not found",
      });
    }

    let updatedData = { ...req.body };

    // If a new image is uploaded
    if (req.file) {
      // Delete the old image from Cloudinary
      if (attributeData.image) {
        const publicId = Attribute.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId, (error, result) => {
          if (error) {
            console.error("Error deleting old image from Cloudinary:", error);
          } else {
            console.log("Old image deleted from Cloudinary:", result);
          }
        });
      }

      // Upload the new image to Cloudinary
      const image = await cloudinary.uploader.upload(req.file.path);
      updatedData.image = image.url;
    }

    // Update the category in the database
    const updatedAttribute = await Attribute.findByIdAndUpdate(id, updatedData, {
      new: true, // Return the updated document
    });

    sendResponse(res, 200, "Success", {
      message: "Attribute updated successfully!",
      data: updatedAttribute,
      statusCode:200
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});


attributeController.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);
    // Find the category by ID
    const attributeItem = await Attribute.findById(id);
    if (!attributeItem) {
      return sendResponse(res, 404, "Failed", {
        message: "Attribute not found",
      });
    }

    // Extract the public ID from the Cloudinary image URL
    const imageUrl = Attribute.image;
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

    // Delete the category from the database
    await Attribute.findByIdAndDelete(id);

    sendResponse(res, 200, "Success", {
      message: "Attribute  associated image deleted successfully!",
      statusCode:200
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});


// subCategoryController.get("/details/:id", auth, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const subCategoryDetails = await subCategory.findOne({ _id: id });
//     const serviceList = await service.find({ subCategoryId: id });
//     const repairList = await repair.find({ subCategoryId: id });
//     const installationList = await installation.find({ subCategoryId: id });

//     // Wishlist IDs extract karna
//     const wishListIds = req.user.wishList.map((item) => item.modelId.toString());

//     // isAdded flag set karna
//     const updateListWithWishlist = (list, type) => {
//       return list.map((item) => ({
//         ...item._doc,
//         isFavourite: wishListIds.includes(item._id.toString()) && 
//                  req.user.wishList.some(w => w.modelId.toString() === item._id.toString() && w.modelType === type)
//       }));
//     };

//     const updatedServiceList = updateListWithWishlist(serviceList, "service");
//     const updatedRepairList = updateListWithWishlist(repairList, "repair");
//     const updatedInstallationList = updateListWithWishlist(installationList, "installation");

//     sendResponse(res, 200, "Success", {
//       message: "Services of sub category retrieved successfully!",
//       data: {
//         subCategoryDetails,
//         serviceList: updatedServiceList,
//         repairList: updatedRepairList,
//         installationList: updatedInstallationList
//       },
//       statusCode: 200
//     });
//   } catch (error) {
//     console.error(error);
//     sendResponse(res, 500, "Failed", {
//       message: error.message || "Internal server error",
//       statusCode: 500
//     });
//   }
// });



// subCategoryController.put("/update-banner", upload.single("banner"), async (req, res) => {
//   try {
//     const id = req.body._id;

//     // Find the category by ID
//     const subCategoryData = await subCategory.findById(id);
//     if (!subCategoryData) {
//       return sendResponse(res, 404, "Failed", {
//         message: "Sub Category not found",
//       });
//     }

//     let updatedData = { ...req.body };

//     // If a new image is uploaded
//     if (req.file) {
      
      
   
//       // Upload the new image to Cloudinary
//       const banner = await cloudinary.uploader.upload(req.file.path);
//       updatedData.banner = banner.url;
//     }

//     // Update the category in the database
//     const updatedSubCategory = await subCategory.findByIdAndUpdate(id, updatedData, {
//       new: true, // Return the updated document
//     });

//     sendResponse(res, 200, "Success", {
//       message: "Sub Category Banner updated successfully!",
//       data: updatedSubCategory,
//       statusCode:200
//     });
//   } catch (error) {
//     console.error(error);
//     sendResponse(res, 500, "Failed", {
//       message: error.message || "Internal server error",
//     });
//   }
// });


module.exports = attributeController;