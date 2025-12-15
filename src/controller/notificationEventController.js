const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const NotificationEvent = require("../model/notificationEvent.Schema");
const notificationEventController = express.Router();
require("dotenv").config();


notificationEventController.post("/create", async (req, res) => {
  try {
    const eventCreated = await NotificationEvent.create(req.body);
    sendResponse(res, 200, "Success", {
      message: "Notification event created successfully!",
      data: eventCreated,
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

notificationEventController.post("/list", async (req, res) => {
  try {
    const { 
      searchKey = "",
      status
    } = req.body;
    const query = {};
    if (status) {
      query.status = status;
    }
    if (searchKey) {
      query.$or = [
        { title: { $regex: searchKey, $options: "i" } },
        { subTitle: { $regex: searchKey, $options: "i" } },
      ];
    }
    const eventList = await NotificationEvent.find(query)
    const totalCount = await NotificationEvent.countDocuments({});
    const activeCount = await NotificationEvent.countDocuments({ status: true });
    sendResponse(res, 200, "Success", {
      message: "Event list retrieved successfully!",
      data: eventList,
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

// notificationEventController.put("/update", async (req, res) => {
//   try {
//     const id = req.body._id;
//     const zipcode = await Zipcode.findById(id);
//     if (!zipcode) {
//       return sendResponse(res, 404, "Failed", {
//         message: "Zipcode not found",
//         statusCode: 403,
//       });
//     }
//     const updatedZipcode = await Zipcode.findByIdAndUpdate(id, req.body, {
//       new: true, // Return the updated document
//     });
//     sendResponse(res, 200, "Success", {
//       message: "Zipcode updated successfully!",
//       data: updatedZipcode,
//       statusCode: 200,
//     });
//   } catch (error) {
//     sendResponse(res, 500, "Failed", {
//       message: error.message || "Internal server error",
//       statusCode: 500,
//     });
//   }
// });

// notificationEventController.delete("/delete/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const zipcode = await Zipcode.findById(id);
//     if (!zipcode) {
//       return sendResponse(res, 404, "Failed", {
//         message: "Zipcode not found",
//         statusCode: 404,
//       });
//     }
//     await Zipcode.findByIdAndDelete(id);
//     sendResponse(res, 200, "Success", {
//       message: "Zipcode deleted successfully!",
//       statusCode: 200,
//     });
//   } catch (error) {
//     console.error(error);
//     sendResponse(res, 500, "Failed", {
//       message: error.message || "Internal server error",
//       statusCode: 500,
//     });
//   }
// });




module.exports = notificationEventController;
