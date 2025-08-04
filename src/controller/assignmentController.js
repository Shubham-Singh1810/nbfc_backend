const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const assignmentController = express.Router();
require("dotenv").config();
const DeliveryAssignment = require("../model/deliveryAssignment");

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


const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config(); // make sure .env is loaded

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
      .populate("vendorId")
      .populate("userId")
      .populate("addressId")
      .populate("products.productId")
      .populate("orderId")
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
    const vendor = assignments[0].vendorId;
    const vendorLocation = {
      latitude: parseFloat(vendor.lat),
      longitude: parseFloat(vendor.long),
    };

    const dropOffs = assignments.map((assign) => {
      console.log( "line 134", assign.userId)
      const user = assign.userId;
      const address = assign.addressId;
      const products = assign.products.map((p) => ({
        productId: p.productId._id,
        name: p.productId.name,
        quantity: p.quantity,
      }));

      return {
        userDetails: {
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          address: address,
          location: {
            latitude: parseFloat(address.lat),
            longitude: parseFloat(address.long),
          },
        },
        product: products,
      };
    });

    // 🔧 Function to get Google Maps driving distance in meters
    async function getDrivingDistance(origin, destination) {
      const key = "AIzaSyD6KJOHKQLUWMAh9Yl5NQrEAI9bxrvYCqQ";
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&mode=driving&key=${key}`;

      const response = await axios.get(url);
      const data = response.data;

      if (data.status === "OK") {
        const distanceInMeters = data.routes[0].legs[0].distance.value;
        return distanceInMeters;
      } else {
        console.error("Google API error:", data.status, data.error_message);
        throw new Error(`Google API error: ${data.status}`);
      }
    }

    // 🚗 Optimize route using greedy nearest neighbor with Google driving distance
    const visited = new Array(dropOffs.length).fill(false);
    const optimizedDropOffs = [];
    let currentLoc = vendorLocation;
    let totalDistance = 0;

    for (let i = 0; i < dropOffs.length; i++) {
      let nearestIndex = -1;
      let minDistance = Infinity;

      for (let j = 0; j < dropOffs.length; j++) {
        if (!visited[j]) {
          const dist = await getDrivingDistance(
            currentLoc,
            dropOffs[j].userDetails.location
          );
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
        firstName: vendor.firstName,
        lastName: vendor.lastName,
        phone: vendor.phone,
        vendorLocation,
      },
      dropOffLocation: optimizedDropOffs,
    };

    const totalCount = await DeliveryAssignment.countDocuments(query);
    const pendingCount = await DeliveryAssignment.countDocuments({
      ...query,
      status: "pending",
    });
    const completedCount = await DeliveryAssignment.countDocuments({
      ...query,
      status: "completed",
    });
    const notDeliveredCount = await DeliveryAssignment.countDocuments({
      ...query,
      status: "notDelivered",
    });

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
