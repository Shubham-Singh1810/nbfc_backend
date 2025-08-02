const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const assignmentController = express.Router();
require("dotenv").config();
const DeliveryAssignment = require("../model/deliveryAssignment");
const haversine = require("haversine-distance");
assignmentController.post("/list", async (req, res) => {
  try {
    const {
      driverId,
      status,
      deliveryDate,
      pageNo = 1,
      pageCount = 10,
      sortByField = "createdAt",
      sortByOrder = "desc",
    } = req.body;

    // Build dynamic query
    const query = {};
    if (driverId) query.driverId = driverId;
    if (status) query.status = status;
    if (deliveryDate) {
      const start = new Date(deliveryDate);
      const end = new Date(deliveryDate);
      end.setDate(end.getDate() + 1); // to include entire day
      query.deliveryDate = { $gte: start, $lt: end };
    }

    // Sorting
    const sortOption = { [sortByField]: sortByOrder === "asc" ? 1 : -1 };

    // Fetch filtered and paginated data with all populates
    const assignments = await DeliveryAssignment.find(query)
      .sort(sortOption)
      .skip((pageNo - 1) * pageCount)
      .limit(pageCount)
    //   .populate("orderId")
    //   .populate("driverId")
    // //   .populate("venderId")
    //   .populate("userId")
    //   .populate("addressId")
    //   .populate("products.productId");

    // Get counts
    const totalCount = await DeliveryAssignment.countDocuments(query);
    const pendingCount = await DeliveryAssignment.countDocuments({ ...query, status: "pending" });
    const completedCount = await DeliveryAssignment.countDocuments({ ...query, status: "completed" });
    const notDeliveredCount = await DeliveryAssignment.countDocuments({ ...query, status: "notDelivered" });

    // Respond
    sendResponse(res, 200, "Success", {
      message: "Delivery assignment list retrieved successfully!",
      data: assignments,
      documentCount: {
        totalCount,
        pendingCount,
        completedCount,
        notDeliveredCount,
      },
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});


assignmentController.post("/optimise-route", async (req, res) => {
  try {
    const {
      driverId,
      status,
      deliveryDate,
      pageNo = 1,
      pageCount = 10,
      sortByField = "createdAt",
      sortByOrder = "desc",
    } = req.body;

    const query = {};
    if (driverId) query.driverId = driverId;
    if (status) query.status = status;
    if (deliveryDate) {
      const start = new Date(deliveryDate);
      const end = new Date(deliveryDate);
      end.setDate(end.getDate() + 1);
      query.deliveryDate = { $gte: start, $lt: end };
    }

    const sortOption = { [sortByField]: sortByOrder === "asc" ? 1 : -1 };

    const assignments = await DeliveryAssignment.find(query)
      .populate("driverId")
      .populate({
        path: "orderId",
        populate: [
        //   { path: "venderId" },
          { path: "userId" },
        //   { path: "addressId" },
        //   { path: "products.productId" },
        ],
      })
      .sort(sortOption)
      .skip((pageNo - 1) * pageCount)
      .limit(pageCount);

    if (!assignments || assignments.length === 0) {
      return sendResponse(res, 200, "Success", {
        message: "No assignments found.",
        data: [],
        documentCount: {
          totalCount: 0,
          pendingCount: 0,
          completedCount: 0,
          notDeliveredCount: 0,
        },
        statusCode: 200,
      });
    }

    // Assuming same vendor for all assignments
    const vendor = assignments[0].orderId.venderId;
    const vendorLocation = {
      latitude: vendor.lat,
      longitude: vendor.long,
    };

    const dropOffs = assignments.map((assign) => {
      const user = assign.orderId.userId;
    //   const address = assign.orderId.addressId;
      const products = assign.orderId.products.map((p) => ({
        productId: p.productId._id,
        name: p.productId.name,
        quantity: p.quantity,
      }));

      return {
        userDetails: {
          fullName: user.fullName,
          phone: user.phone,
        //   address: address,
          location: {
            latitude: address.latitude,
            longitude: address.longitude,
          },
        },
        product: products,
      };
    });

    // Optimize route using greedy nearest neighbor
    const visited = new Array(dropOffs.length).fill(false);
    const optimizedDropOffs = [];
    let currentLoc = vendorLocation;
    let totalDistance = 0;

    for (let i = 0; i < dropOffs.length; i++) {
      let nearestIndex = -1;
      let minDistance = Infinity;

      for (let j = 0; j < dropOffs.length; j++) {
        if (!visited[j]) {
          const dist = haversine(currentLoc, dropOffs[j].userDetails.location);
          if (dist < minDistance) {
            minDistance = dist;
            nearestIndex = j;
          }
        }
      }

      if (nearestIndex !== -1) {
        visited[nearestIndex] = true;
        optimizedDropOffs.push(dropOffs[nearestIndex]);
        totalDistance += minDistance;
        currentLoc = dropOffs[nearestIndex].userDetails.location;
      }
    }

    const totalDistanceKm = parseFloat((totalDistance / 1000).toFixed(2));
    const totalEarning = totalDistanceKm * 20;

    const responseData = {
      distanceTravelled: totalDistanceKm,
      totalEarning,
      vendorDetails: {
        fullName: vendor.fullName,
        phone: vendor.phone,
        // address: vendor.address,
      },
      dropOffLocation: optimizedDropOffs,
    };

    const totalCount = await DeliveryAssignment.countDocuments(query);
    const pendingCount = await DeliveryAssignment.countDocuments({ ...query, status: "pending" });
    const completedCount = await DeliveryAssignment.countDocuments({ ...query, status: "completed" });
    const notDeliveredCount = await DeliveryAssignment.countDocuments({ ...query, status: "notDelivered" });

    sendResponse(res, 200, "Success", {
      message: "Optimized delivery assignment list!",
      data: responseData,
      documentCount: {
        totalCount,
        pendingCount,
        completedCount,
        notDeliveredCount,
      },
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});





module.exports = assignmentController;
