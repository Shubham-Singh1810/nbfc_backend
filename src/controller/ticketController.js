const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const   Ticket = require("../model/ticket.Schema");
const ticketController = express.Router();
require("dotenv").config();
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");

// ticketController.post("/create", upload.single("image"), async (req, res) => {
//     try {
//       let obj;
//       if (req.file) {
//         let image = await cloudinary.uploader.upload(req.file.path, function (err, result) {
//           if (err) {
//             return err;
//           } else {
//             return result;
//           }
//         });
//         obj = { ...req.body, image: image.url };
//       }
//       const ticketCreated = await Ticket.create(obj);
//       sendResponse(res, 200, "Success", {
//         message: "Ticket created successfully!",
//         data: ticketCreated,
//         statusCode: 200
//       });
//     } catch (error) {
//       console.error(error);
//       sendResponse(res, 500, "Failed", {
//         message: error.message || "Internal server error",
//         statusCode: 500
//       });
//     }
//   });





ticketController.post("/create", upload.single("image"), async (req, res) => {
  try {
    let obj = req.body;

    if (req.file) {
      const image = await cloudinary.uploader.upload(req.file.path);
      obj.image = image.url;
    }

    const ticketCreated = await Ticket.create(obj);

    sendResponse(res, 200, "Success", {
      message: "Ticket created successfully!",
      data: ticketCreated,
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




ticketController.post("/list", async (req, res) => {
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
    const ticketList = await Ticket.find(query)
      .sort(sortOption)
      .limit(parseInt(pageCount))
      .skip(parseInt(pageNo - 1) * parseInt(pageCount));
    const totalCount = await Ticket.countDocuments({});
    const activeCount = await Ticket.countDocuments({ status: true });
    sendResponse(res, 200, "Success", {
      message: "Ticket list retrieved successfully!",
      data: ticketList,
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


module.exports = ticketController;