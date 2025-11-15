const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const PaydayLoanApplication = require("../model/paydayLoanApplication.Schema");
const paydayLoanApplicationController = express.Router();
require("dotenv").config();
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");
const auth = require("../utils/auth");
const { generateEmi } = require("../utils/emiCalculator");
const pdApplicationValidation = require("../middleware/loanApplicationValidation")

paydayLoanApplicationController.post(
  "/create",
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
      let newCode;
      const lastLoanApplication = await PaydayLoanApplication.findOne().sort({ createdAt: -1 });
      if (lastLoanApplication?.code) {
        const lastNumber = parseInt(lastLoanApplication.code.replace("RPL", ""), 10) || 0;
        newCode = "RPL" + String(lastNumber + 1).padStart(3, "0");
      } else {
        newCode = "RPL001";
      }
      const loanApplicationCreated = await PaydayLoanApplication.create({
        code: newCode,
        loanAmount,
        intrestRate,
        intrestRateType,
        loanTenuare,
        loanTenuareType,
        repaymentFrequency,
        repaymentFrequencyType,
        userId,
        loanId,
        ...restFields,
      });

      sendResponse(res, 200, "Success", {
        message: "Payday Loan Application created successfully!",
        statusCode:"200",
        data: loanApplicationCreated,
      });

    } catch (error) {
      console.error("Payday Loan Application create error:", error);
      sendResponse(res, 500, "Failed", {
        message: error.message || "Internal server error",
      });
    }
  }
);
paydayLoanApplicationController.post("/list", async (req, res) => {
  try {
    const {
      searchKey = "",
      status,
      processingStatus,
      userId,
      branchId,
      assignedAdminId,
      createdBy,
      loanPurposeId,
      pageNo = 1,
      pageCount = 10,
      sortByField,
      sortByOrder,
    } = req.body;

    const query = {};

    // ===== Filters =====
    if (status) query.status = status;
    if (processingStatus) query.processingStatus = processingStatus;
    if (userId) query.userId = userId;
    if (branchId) query.branchId = branchId;
    if (assignedAdminId) query.assignedAdminId = assignedAdminId;
    if (createdBy) query.createdBy = createdBy;
    if (loanPurposeId) query.loanPurposeId = loanPurposeId;

    // ===== Search =====
    if (searchKey && searchKey.trim() !== "") {
      query.$or = [
        { fullName: { $regex: searchKey, $options: "i" } },
        { email: { $regex: searchKey, $options: "i" } },
        { code: { $regex: searchKey, $options: "i" } },
        { loanAmount: { $regex: searchKey, $options: "i" } },
        { bankName: { $regex: searchKey, $options: "i" } },
        { pan: { $regex: searchKey, $options: "i" } },
      ];
    }

    // ===== Sorting =====
    const sortField = sortByField || "createdAt";
    const sortOrder = sortByOrder === "asc" ? 1 : -1;
    const sortOption = { [sortField]: sortOrder };

    // ===== Fetch Data =====
    const loanApplications = await PaydayLoanApplication.find(query)
      .populate("userId", "firstName lastName email phone profilePic")
      .populate("branchId", "name contactPerson address state city pincode")
      .populate("assignedAdminId", "firstName lastName profilePic phone email")
      .populate("createdBy", "firstName lastName profilePic phone email")
      .populate("loanPurposeId", "name")
      .sort(sortOption)
      .limit(parseInt(pageCount))
      .skip((parseInt(pageNo) - 1) * parseInt(pageCount));

    // ===== Counts =====
    const totalCount = await PaydayLoanApplication.countDocuments(query);
    const statusWiseCount = await PaydayLoanApplication.aggregate([
      { $match: query },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // ===== Response =====
    sendResponse(res, 200, "Success", {
      message: "Payday Loan Application list retrieved successfully!",
      data: loanApplications,
      statusCode:"200",
      documentCount: {
        totalCount,
        statusWiseCount,
      },
    });
  } catch (error) {
    console.error("Payday Loan Application List error:", error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});
paydayLoanApplicationController.get("/stats", async (req, res) => {
  try {
    // ===== Current Counts =====
    const totalCount = await PaydayLoanApplication.countDocuments({});
    const pendingCount = await PaydayLoanApplication.countDocuments({
      status: "pending",
    });
    const approvedCount = await PaydayLoanApplication.countDocuments({
      status: "approved",
    });
    const rejectedCount = await PaydayLoanApplication.countDocuments({
      status: "rejected",
    });
    const disbursedCount = await PaydayLoanApplication.countDocuments({
      status: "disbursed",
    });
    const completedCount = await PaydayLoanApplication.countDocuments({
      status: "completed",
    });

    // ===== Last Month Dates =====
    const now = new Date();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // ===== Last Month Counts =====
    const lastMonthTotal = await PaydayLoanApplication.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });
    const lastMonthPending = await PaydayLoanApplication.countDocuments({
      status: "pending",
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });
    const lastMonthApproved = await PaydayLoanApplication.countDocuments({
      status: "approved",
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });
    const lastMonthRejected = await PaydayLoanApplication.countDocuments({
      status: "rejected",
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });
    const lastMonthDisbursed = await PaydayLoanApplication.countDocuments({
      status: "disbursed",
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });
    const lastMonthCompleted = await PaydayLoanApplication.countDocuments({
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
paydayLoanApplicationController.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const loanApplication = await PaydayLoanApplication.findById(id);
    if (!loanApplication) {
      return sendResponse(res, 404, "Failed", {
        message: "Payday loan application not found",
      });
    }
    await PaydayLoanApplication.findByIdAndDelete(id);

    sendResponse(res, 200, "Success", {
      message: "Payday Loan application deleted successfully!",
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});
paydayLoanApplicationController.get("/details/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const loanApplication = await PaydayLoanApplication.findOne({ _id: id })
      .populate("userId", "firstName lastName email phone profilePic")
      .populate("branchId", "name contactPerson address state city pincode")
      .populate("assignedAdminId", "firstName lastName profilePic phone email")
      .populate("createdBy", "firstName lastName profilePic phone email")
      .populate("loanPurposeId", "name")
    if (loanApplication) {
      return sendResponse(res, 200, "Success", {
        message: "Payday Loan application details fetched successfully",
        data: loanApplication,
        statusCode: 200,
      });
    } else {
      return sendResponse(res, 404, "Failed", {
        message: "Loan application not found",
        statusCode: 404,
      });
    }
  } catch (error) {
    return sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error.",
      statusCode: 500,
    });
  }
});
paydayLoanApplicationController.put(
  "/update",
  upload.array("documents", 5),
  async (req, res) => {
    try {
      const { _id } = req.body;
      if (!_id) {
        return sendResponse(res, 400, "Failed", {
          message: "Loan Application ID (_id) is required",
        });
      }
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

      // ✅ Validation
      if (!userId) return sendResponse(res, 400, "Failed", { message: "User ID is required" });
      if (!loanId) return sendResponse(res, 400, "Failed", { message: "Loan ID is required" });
      if (!loanAmount || loanAmount <= 0) return sendResponse(res, 400, "Failed", { message: "Loan amount must be greater than 0" });
      if (!loanTenuare || loanTenuare <= 0) return sendResponse(res, 400, "Failed", { message: "Loan tenure must be greater than 0" });
      if (!intrestRate || intrestRate <= 0) return sendResponse(res, 400, "Failed", { message: "Interest rate must be greater than 0" });
      if (!intrestRateType || !["flat", "reducing", "simple", "compound"].includes(intrestRateType))
        return sendResponse(res, 400, "Failed", { message: "Invalid interest rate type" });
      if (!loanTenuareType || !["months", "days"].includes(loanTenuareType))
        return sendResponse(res, 400, "Failed", { message: "Invalid loan tenure type" });
      if (!repaymentFrequency || repaymentFrequency <= 0)
        return sendResponse(res, 400, "Failed", { message: "Repayment frequency must be greater than 0" });
      if (!repaymentFrequencyType || !["months", "days"].includes(repaymentFrequencyType))
        return sendResponse(res, 400, "Failed", { message: "Invalid repayment frequency type" });

      // ✅ Handle documents
      let documents = [];
      if (req.files && req.files.length > 0) {
        const inputDocs = JSON.parse(req.body.documentsMeta || "[]");
        for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i];
          const uploaded = await cloudinary.uploader.upload(file.path);
          documents.push({
            name: inputDocs[i]?.name || `Doc-${i + 1}`,
            image: uploaded.secure_url,
          });
        }
      } else if (req.body.documents) {
        try {
          documents = JSON.parse(req.body.documents);
        } catch (err) {
          return sendResponse(res, 400, "Failed", { message: "Invalid documents format" ,statusCode:400});
        }
      }

      // ✅ Handle collateral
      let collateralDetails = [];
      if (req.body.collateralDetails) {
        try {
          collateralDetails = JSON.parse(req.body.collateralDetails);
        } catch (err) {
          return sendResponse(res, 400, "Failed", { message: "Invalid collateral details format" , statusCode:400});
        }
      }

      // 👉 Update
      const updatedLoanApplication = await LoanApplication.findByIdAndUpdate(
        _id,
        {
          ...restFields,
          loanAmount,
          intrestRate,
          intrestRateType,
          loanTenuare,
          loanTenuareType,
          repaymentFrequency,
          repaymentFrequencyType,
          userId,
          loanId,
          documents,
          collateralDetails,
        },
        { new: true }
      );

      if (!updatedLoanApplication)
        return sendResponse(res, 404, "Failed", { message: "Loan Application not found" , statusCode:404});

      sendResponse(res, 200, "Success", {
        message: "Loan Application updated successfully!",
        data: updatedLoanApplication,
        statusCode:200
      });
    } catch (error) {
      console.error("Loan Application update error:", error);
      sendResponse(res, 500, "Failed", {
        message: error.message || "Internal server error",
        statusCode:500
      });
    }
  }
);

paydayLoanApplicationController.post(
  "/apply", pdApplicationValidation,
  async (req, res) => {
    try {
      let newCode;
      const lastLoanApplication = await PaydayLoanApplication.findOne().sort({ createdAt: -1 });
      if (lastLoanApplication?.code) {
        const lastNumber = parseInt(lastLoanApplication.code.replace("RPL", ""), 10) || 0;
        newCode = "RPL" + String(lastNumber + 1).padStart(3, "0");
      } else {
        newCode = "RPL001";
      }
      const loanApplicationCreated = await PaydayLoanApplication.create(req.body);
      sendResponse(res, 200, "Success", {
        message: "Payday Loan Application created successfully!",
        statusCode:"200",
        data: loanApplicationCreated,
      });

    } catch (error) {
      console.error("Payday Loan Application create error:", error);
      sendResponse(res, 500, "Failed", {
        message: error.message || "Internal server error",
      });
    }
  }
);
paydayLoanApplicationController.get("/in-progress/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const loanApplication = await PaydayLoanApplication.findOne({ userId: id , status:"pending"})
      .populate("userId", "firstName lastName email phone profilePic")
      .populate("branchId", "name contactPerson address state city pincode")
      .populate("assignedAdminId", "firstName lastName profilePic phone email")
      .populate("createdBy", "firstName lastName profilePic phone email")
      .populate("loanPurposeId", "name")
    if (loanApplication) {
      return sendResponse(res, 200, "Success", {
        message: "In progress loan retrived successfully",
        data: loanApplication,
        statusCode: 200,
      });
    } else {
      return sendResponse(res, 404, "Failed", {
        message: "Loan application not found",
        statusCode: 404,
      });
    }
  } catch (error) {
    return sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error.",
      statusCode: 500,
    });
  }
});
module.exports = paydayLoanApplicationController;
