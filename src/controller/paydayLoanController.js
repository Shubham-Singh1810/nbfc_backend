const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const Loan = require("../model/loan.Schema");
const PaydayLoanType = require("../model/paydayLoanType.Schema");
const Faq = require("../model/faq.Schema");
const paydayLoanController = express.Router();
require("dotenv").config();
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");
const auth = require("../utils/auth");

paydayLoanController.post(
  "/create",
  upload.fields([
    { name: "icon", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      let obj = { ...req.body };

      // ✅ Handle icon upload if provided
      if (req.files && req.files.icon && req.files.icon.length > 0) {
        const iconFile = req.files.icon[0];
        const uploadedIcon = await cloudinary.uploader.upload(iconFile.path);
        obj.icon = uploadedIcon.secure_url;
      }

      // ✅ Generate Loan Code (RL001 format)
      if (!req.body.code) {
        const lastLoan = await PaydayLoanType.findOne().sort({ createdAt: -1 });

        let newCode;
        if (lastLoan?.code) {
          const lastNumber = parseInt(lastLoan.code.replace("PDL", ""), 10) || 0;
          newCode = "PDL" + String(lastNumber + 1).padStart(3, "0");
        } else {
          newCode = "PDL01";
        }

        obj.code = newCode;
      }

      // ✅ Create loan
      const loanCreated = await PaydayLoanType.create(obj);

      sendResponse(res, 200, "Success", {
        message: "Payday loan created successfully!",
        data: loanCreated,
        statusCode: 200,
      });
    } catch (error) {
      console.error(error);
      sendResponse(res, 500, "Failed", {
        message: error.message || "Internal server error",
      });
    }
  }
);
paydayLoanController.get("/details", async (req, res) => {
  try {
    
    const loanType = await PaydayLoanType.findOne({});
    if (loanType) {
      return sendResponse(res, 200, "Success", {
        message: "Payday Loan type details fetched  successfully",
        data: loanType,
        statusCode: 200,
      });
    } else {
      return sendResponse(res, 404, "Failed", {
        message: "Payday loan type not found",
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
paydayLoanController.put("/update",upload.single("icon"), async (req, res) => {
  try {
    const id = req.body._id;

    // Find the category by ID
    const loanData = await PaydayLoanType.findById(id);
    if (!loanData) {
      return sendResponse(res, 404, "Failed", {
        message: "Payday loan Type not found",
      });
    }
    let obj = { ...req.body };
    if (req.file) {
      const image = await cloudinary.uploader.upload(req.file.path);
      obj.icon = image.secure_url;
    }

    let updatedData = obj;
    const updatedLoan = await PaydayLoanType.findByIdAndUpdate(id, updatedData, {
      new: true, 
    });
    sendResponse(res, 200, "Success", {
      message: "Payday Loan type updated successfully!",
      data: updatedLoan,
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});


module.exports = paydayLoanController;
