const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const LoanApplication = require("../model/loanApplication.Schema");
const loanApplicationController = express.Router();
require("dotenv").config();
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");
const auth = require("../utils/auth");
const { generateEmi } = require("../utils/emiCalculator");

loanApplicationController.post(
  "/create",
  upload.array("documents", 5),
  async (req, res) => {
    try {
      const {
        loanAmount,
        intrestRate,
        intrestRateType,
        loanTenuare,
        loanTenuareType,
        repaymentFrequency,
        repaymentFrequencyType,
        userId,
        loanId,
        ...restFields
      } = req.body;

      if (!userId) {
        return sendResponse(res, 400, "Failed", {
          message: "User ID is required",
        });
      }
      if (!loanId) {
        return sendResponse(res, 400, "Failed", {
          message: "Loan ID is required",
        });
      }
      if (!loanAmount || loanAmount <= 0) {
        return sendResponse(res, 400, "Failed", {
          message: "Loan amount must be greater than 0",
        });
      }
      if (!loanTenuare || loanTenuare <= 0) {
        return sendResponse(res, 400, "Failed", {
          message: "Loan tenure must be greater than 0",
        });
      }
      if (!intrestRate || intrestRate <= 0) {
        return sendResponse(res, 400, "Failed", {
          message: "Interest rate must be greater than 0",
        });
      }
      if (
        !intrestRateType ||
        !["flat", "reducing", "simple", "compound"].includes(intrestRateType)
      ) {
        return sendResponse(res, 400, "Failed", {
          message: "Invalid interest rate type",
        });
      }
      if (!loanTenuareType || !["months", "days"].includes(loanTenuareType)) {
        return sendResponse(res, 400, "Failed", {
          message: "Invalid loan tenure type",
        });
      }
      if (!repaymentFrequency || repaymentFrequency <= 0) {
        return sendResponse(res, 400, "Failed", {
          message: "Repayment frequency must be greater than 0",
        });
      }
      if (
        !repaymentFrequencyType ||
        !["months", "days"].includes(repaymentFrequencyType)
      ) {
        return sendResponse(res, 400, "Failed", {
          message: "Invalid repayment frequency type",
        });
      }
      const emiData = generateEmi({
        loanAmount,
        intrestRate,
        intrestRateType,
        loanTenuare,
        loanTenuareType,
        repaymentFrequency,
        repaymentFrequencyType,
      });
      let newCode;
      // ✅ Generate Loan Code (RL001 format)
      if (!req.body.code) {
        const lastLoanApplication = await LoanApplication.findOne().sort({
          createdAt: -1,
        });

        if (lastLoanApplication?.code) {
          // Example: RL001 → RL002
          const lastNumber =
            parseInt(lastLoanApplication.code.replace("RL", ""), 10) || 0;
          newCode = "RL" + String(lastNumber + 1).padStart(3, "0");
        } else {
          // If no loan exists
          newCode = "RL001";
        }
      }
      let documents = [];


      if (req.files && req.files.length > 0) {
        const inputDocs = JSON.parse(req.body.documentsMeta || "[]"); // alag key for meta

        for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i];
          const uploaded = await cloudinary.uploader.upload(file.path);

          documents.push({
            name: inputDocs[i]?.name || `Doc-${i + 1}`,
            image: uploaded.secure_url,
          });
        }
      }
      let collateralDetails = [];
if (req.body.collateralDetails) {
  try {
    collateralDetails = JSON.parse(req.body.collateralDetails); // ✅ convert string → array
  } catch (err) {
    return sendResponse(res, 400, "Failed", { message: "Invalid collateral details format" });
  }
}

      // 👉 Loan Application create
      const loanApplicationCreated = await LoanApplication.create({
        ...restFields,
        loanAmount,
        intrestRate,
        intrestRateType,
        loanTenuare,
        loanTenuareType,
        repaymentFrequency,
        repaymentFrequencyType,
        emiSchedule: emiData.emiSchedule,
        code: newCode,
        userId,
        loanId,
        documents,
        collateralDetails
      });

      sendResponse(res, 200, "Success", {
        message: "Loan Application created successfully!",
        data: loanApplicationCreated,
        statusCode: 200,
      });
    } catch (error) {
      console.error("Loan Application create error:", error);
      sendResponse(res, 500, "Failed", {
        message: error.message || "Internal server error",
      });
    }
  }
);

loanApplicationController.post("/list", async (req, res) => {
  try {
    const {
      searchKey = "",
      status,
      userId,
      branchId,
      assignedAdminId,
      createdBy,
      pageNo = 1,
      pageCount = 10,
      sortByField,
      sortByOrder,
      loanId,
    } = req.body;

    const query = {};

    // ===== Filters =====
    if (status) query.status = status;
    if (loanId) query.loanId = loanId;
    if (userId) query.userId = userId;
    if (branchId) query.branchId = branchId;
    if (assignedAdminId) query.assignedAdminId = assignedAdminId;
    if (createdBy) query.createdBy = createdBy;

    // ===== Search =====
    if (searchKey) {
      query.$or = [
        { loanAmount: { $regex: searchKey, $options: "i" } },
        { intrestRate: { $regex: searchKey, $options: "i" } },
      ];
    }

    // ===== Sorting =====
    const sortField = sortByField || "createdAt";
    const sortOrder = sortByOrder === "asc" ? 1 : -1;
    const sortOption = { [sortField]: sortOrder };

    // ===== Fetch Data =====

    const loanApplicationList = await LoanApplication.find(query)
      .populate("userId", "firstName lastName email phone profilePic") // user details
      .populate("loanId", "name code") // loan details
      .populate("branchId", "name contactPerson address state city pincode") // branch details
      .populate("assignedAdminId", "firstName lastName profilePic phone email") // admin details
      .populate("createdBy", "firstName lastName profilePic phone email") // createdBy details
      .sort(sortOption)
      .limit(parseInt(pageCount))
      .skip((parseInt(pageNo) - 1) * parseInt(pageCount));

    // ===== Counts =====
    const totalCount = await LoanApplication.countDocuments(query);
    const statusWiseCount = await LoanApplication.aggregate([
      { $match: query },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    sendResponse(res, 200, "Success", {
      message: "Loan Application list retrieved successfully!",
      data: loanApplicationList,
      documentCount: {
        totalCount,
        statusWiseCount,
      },
      statusCode: 200,
    });
  } catch (error) {
    console.error("Loan Application List error:", error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});

loanApplicationController.get("/stats", async (req, res) => {
  try {
    // ===== Current Counts =====
    const totalCount = await LoanApplication.countDocuments({});
    const pendingCount = await LoanApplication.countDocuments({
      status: "pending",
    });
    const approvedCount = await LoanApplication.countDocuments({
      status: "approved",
    });
    const rejectedCount = await LoanApplication.countDocuments({
      status: "rejected",
    });
    const disbursedCount = await LoanApplication.countDocuments({
      status: "disbursed",
    });
    const completedCount = await LoanApplication.countDocuments({
      status: "completed",
    });

    // ===== Last Month Dates =====
    const now = new Date();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // ===== Last Month Counts =====
    const lastMonthTotal = await LoanApplication.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });
    const lastMonthPending = await LoanApplication.countDocuments({
      status: "pending",
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });
    const lastMonthApproved = await LoanApplication.countDocuments({
      status: "approved",
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });
    const lastMonthRejected = await LoanApplication.countDocuments({
      status: "rejected",
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });
    const lastMonthDisbursed = await LoanApplication.countDocuments({
      status: "disbursed",
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });
    const lastMonthCompleted = await LoanApplication.countDocuments({
      status: "completed",
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });

    // ===== Trend Calculator =====
    const getTrend = (current, last) => {
      if (last === 0 && current === 0)
        return { percent: 0, isTrendPositive: false };
      if (last === 0) return { percent: 100, isTrendPositive: true };
      const percent = ((current - last) / last) * 100;
      return {
        percent: Number(percent.toFixed(2)),
        isTrendPositive: percent >= 0,
      };
    };

    const trends = {
      totalTrend: getTrend(totalCount, lastMonthTotal),
      pendingTrend: getTrend(pendingCount, lastMonthPending),
      approvedTrend: getTrend(approvedCount, lastMonthApproved),
      rejectedTrend: getTrend(rejectedCount, lastMonthRejected),
      disbursedTrend: getTrend(disbursedCount, lastMonthDisbursed),
      completedTrend: getTrend(completedCount, lastMonthCompleted),
    };

    // ===== Response =====
    sendResponse(res, 200, "Success", {
      message: "Loan Application statistics retrieved successfully!",
      stats: {
        totalCount,
        pendingCount,
        approvedCount,
        rejectedCount,
        disbursedCount,
        completedCount,
        trends,
      },
      statusCode: 200,
    });
  } catch (error) {
    console.error("Loan Application Stats error:", error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});
loanApplicationController.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const loanApplication = await LoanApplication.findById(id);
    if (!loanApplication) {
      return sendResponse(res, 404, "Failed", {
        message: "Loan application not found",
      });
    }
    await LoanApplication.findByIdAndDelete(id);

    sendResponse(res, 200, "Success", {
      message: "Loan application deleted successfully!",
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});


loanApplicationController.post("/emi-list", async (req, res) => {
  try {
    const {
      status,
      userId,
      branchId,
      assignedAdminId,
      createdBy,
      loanId,
      pageNo = 1,
      pageCount = 10,
      sortByField,
      sortByOrder,
    } = req.body;
    const query = {};
    if (loanId) query.loanId = loanId;
    if (userId) query.userId = userId;
    if (branchId) query.branchId = branchId;
    if (assignedAdminId) query.assignedAdminId = assignedAdminId;
    if (createdBy) query.createdBy = createdBy;
    const sortField = sortByField || "createdAt";
    const sortOrder = sortByOrder === "asc" ? 1 : -1;
    const sortOption = { [sortField]: sortOrder };
    const applications = await LoanApplication.find(query)
      .populate("userId", "firstName lastName email phone profilePic")
      .populate("loanId", "name code")
      .populate("branchId", "name contactPerson")
      .populate("assignedAdminId", "firstName lastName email")
      .populate("createdBy", "firstName lastName email")
      .sort(sortOption);

    let emiList = [];
    applications.forEach((app) => {
      app.emiSchedule.forEach((emi) => {
        if (!status || emi.status === status) {
          emiList.push({
            applicationId: app._id,
            applicationCode: app.code,
            loanId: app.loanId?._id,
            loanName: app.loanId?.name,
            userId: app.userId?._id,
            userName: `${app.userId?.firstName} ${app.userId?.lastName}`,
            branchName: app.branchId?.name,
            assignedAdmin: app.assignedAdminId
              ? `${app.assignedAdminId.firstName} ${app.assignedAdminId.lastName}`
              : null,
            expectedDate: emi.expectedDate,
            amount: emi.amount,
            status: emi.status,
            paidDate: emi.paidDate,
            transectionId: emi.transectionId,
          });
        }
      });
    });

    // === Sorting EMI list manually (kyunki EMI application ke andar hai) ===
    emiList.sort((a, b) => {
      if (sortOrder === 1) {
        return new Date(a[sortField]) - new Date(b[sortField]);
      } else {
        return new Date(b[sortField]) - new Date(a[sortField]);
      }
    });

    // === Pagination on EMI list ===
    const totalCount = emiList.length;
    const startIndex = (parseInt(pageNo) - 1) * parseInt(pageCount);
    const paginatedEmiList = emiList.slice(
      startIndex,
      startIndex + parseInt(pageCount)
    );

    // === Status wise count ===
    const statusWiseCount = emiList.reduce((acc, emi) => {
      acc[emi.status] = (acc[emi.status] || 0) + 1;
      return acc;
    }, {});

    sendResponse(res, 200, "Success", {
      message: "EMI list retrieved successfully!",
      data: paginatedEmiList,
      documentCount: {
        totalCount,
        statusWiseCount,
      },
      statusCode: 200,
    });
  } catch (error) {
    console.error("EMI List error:", error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});



module.exports = loanApplicationController;
