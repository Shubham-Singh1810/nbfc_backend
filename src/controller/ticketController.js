const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const Ticket = require("../model/ticket.Schema");
const User = require("../model/user.Schema");
const Driver = require("../model/driver.Schema");
const Vender = require("../model/vender.Schema");
const ticketController = express.Router();
require("dotenv").config();
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");

ticketController.post("/create", upload.single("image"), async (req, res) => {
  try {
    let obj = req.body;

    // Image upload logic
    if (req.file) {
      const image = await cloudinary.uploader.upload(req.file.path);
      obj.image = image.url;
    }
    const lastTicket = await Ticket.findOne().sort({ createdAt: -1 });
    let count = 1;

    if (lastTicket && lastTicket.code) {
      const lastCount = parseInt(lastTicket.code.replace("RLST", ""), 10);
      count = lastCount + 1;
    }
    obj.code = `RLST${String(count).padStart(3, "0")}`; 
    const ticketCreated = await Ticket.create(obj);
    sendResponse(res, 200, "Success", {
      message: "Ticket created successfully!",
      data: ticketCreated,
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

ticketController.post("/list", async (req, res) => {
  try {
    const {
      searchKey = "",
      status,
      pageNo = 1,
      pageCount = 10,
      sortByField,
      sortByOrder,
      userId,
      userType
    } = req.body;

    const query = {};
    if (status !== undefined && status !== "") query.status = status;
    if (searchKey) query.subject = { $regex: searchKey, $options: "i" };
    if (userId) query.userId = userId;

    const sortField = sortByField || "createdAt";
    const sortOrder = sortByOrder === "asc" ? 1 : -1;
    const sortOption = { [sortField]: sortOrder };

    const ticketList = await Ticket.find(query)
      .sort(sortOption)
      .limit(parseInt(pageCount))
      .skip((parseInt(pageNo) - 1) * parseInt(pageCount))
      .populate("ticketCategoryId")
      
      .populate({
        path: "assignedTo",
        select: "firstName lastName profilePic phone",
      })
      .populate({
        path: "userId",
        select: "firstName lastName profilePic phone",
      });
      

    
    const totalCount = await Ticket.countDocuments({});
    const activeCount = await Ticket.countDocuments({ status: "open" });

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

ticketController.put("/update", async (req, res) => {
  try {
    const id = req.body._id;
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return sendResponse(res, 404, "Failed", {
        message: "Ticket not found",
        statusCode: 403,
      });
    }
    const updatedTicket = await Ticket.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true, 
      }
    );
    sendResponse(res, 200, "Success", {
      message: "Ticket updated successfully!",
      data: updatedTicket,
      statusCode: 200,
    });
  } catch (error) {
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
      statusCode: 500,
    });
  }
});

module.exports = ticketController;
