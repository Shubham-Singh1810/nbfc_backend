const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const Admin = require("../model/admin.Schema");
const adminController = express.Router();
require("dotenv").config();
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendMail } = require("../utils/common");
// ✅ Admin Create

function generatePin(length = 6) {
  let pin = "";
  const digits = "0123456789";
  for (let i = 0; i < length; i++) {
    pin += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return pin;
}

adminController.post(
  "/create",
  upload.single("profilePic"),
  async (req, res) => {
    try {
      let { ...rest } = req.body;
      const plainPassword = generatePin();

      // ✅ Password encrypt karo
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      // ✅ Handle profilePic upload if file is provided
      if (req.file) {
        const image = await cloudinary.uploader.upload(req.file.path);
        rest.profilePic = image.secure_url;
      }

      // ✅ Generate Admin Code (AD001 format)
      if (!req.body.code) {
        const lastAdmin = await Admin.findOne().sort({ createdAt: -1 });

        let newCode;
        if (lastAdmin?.code) {
          // Example: AD001 → AD002
          const lastNumber =
            parseInt(lastAdmin.code.replace("AD", ""), 10) || 0;
          newCode = "AD" + String(lastNumber + 1).padStart(3, "0");
        } else {
          // If no admin exists
          newCode = "AD001";
        }

        rest.code = newCode;
      }

      // ✅ Create admin
      const AdminData = await Admin.create({
        ...rest,
        password: hashedPassword,
      });

      // ✅ Generate JWT token
      const token = jwt.sign(
        { userId: AdminData._id, phone: AdminData.phone },
        process.env.JWT_KEY
      );

      // ✅ Store token in DB
      const updatedAdmin = await Admin.findByIdAndUpdate(
        AdminData._id,
        { token },
        { new: true }
      );
      const html = `
  <div style="font-family: Arial, sans-serif; line-height:1.5; color:#222;">
    <h2 style="color:#0b5ed7; margin-bottom:0.2rem;">Welcome to Rupee Loan, ${req.body?.firstName}!</h2>
    <p>Congratulations — your admin account has been created successfully.</p>

    <p><strong>Login details</strong><br/>
      Email: ${req?.body?.email}<br/>
      Temporary PIN: <strong style="font-size:1.1rem;">${plainPassword}</strong>
    </p>

    <p style="margin-top:0.5rem;">
      For security, please change this PIN after your first login. If you didn't request this account, contact our support immediately.
    </p>

    <hr style="border:none; border-top:1px solid #eee; margin:1rem 0;" />

    <p style="font-size:0.95rem; color:#666;">Regards,<br/>Rupee Loan Team</p>
  </div>
`;

      await sendMail(
        req.body.email,
        "Welcome to Rupee Loan — Your Admin Account Details",
        html 
      );
      sendResponse(res, 200, "Success", {
        message: "Admin created successfully!",
        data: updatedAdmin,
        statusCode: 200,
      });
    } catch (error) {
      console.error(error);
      sendResponse(res, 500, "Failed", {
        message: error.message || "Internal server error",
        statusCode: 500,
      });
    }
  }
);

adminController.put("/update", async (req, res) => {
  try {
    const AdminData = await Admin.findByIdAndUpdate(req?.body?._id, req.body, {
      new: true,
    });
    sendResponse(res, 200, "Success", {
      message: "Admin updated successfully!",
      data: AdminData,
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

adminController.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await Admin.findById(id);
    if (!admin) {
      return sendResponse(res, 404, "Failed", {
        message: "Admin not found",
      });
    }

    await Admin.findByIdAndDelete(id);
    sendResponse(res, 200, "Success", {
      message: "Admin deleted successfully!",
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});

adminController.post("/login", async (req, res) => {
  try {
    const { email, password, deviceId } = req.body;

    if (!email || !password) {
      return sendResponse(res, 400, "Failed", {
        message: "Email/Phone and Password are required",
        statusCode: 400,
      });
    }
    let query = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(email)) {
      query.email = email;
    } else {
      query.phone = email;
    }
    const user = await Admin.findOne(query);
    if (!user) {
      return sendResponse(res, 422, "Failed", {
        message: "Invalid Credentials",
        statusCode: 422,
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendResponse(res, 422, "Failed", {
        message: "Invalid Credentials",
        statusCode: 422,
      });
    }
    let updatedAdmin = await Admin.findByIdAndUpdate(
      user._id,
      { deviceId },
      { new: true }
    );

    return sendResponse(res, 200, "Success", {
      message: "Admin logged in successfully",
      data: updatedAdmin,
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    return sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error.",
      statusCode: 500,
    });
  }
});

adminController.post("/list", async (req, res) => {
  try {
    const {
      searchKey = "",
      status,
      pageNo = 1,
      pageCount = 10,
      sortByField,
      sortByOrder,
      branch,
      role
    } = req.body;

    const query = {};
    if (status) query.status = status;
    if (branch) query.branch = branch;
    if (role) query.role = role;
    if (searchKey) {
      query.$or = [
        { firstName: { $regex: searchKey, $options: "i" } },
        { lastName: { $regex: searchKey, $options: "i" } },
        { email: { $regex: searchKey, $options: "i" } },
      ];
    }

    // Construct sorting object
    const sortField = sortByField || "createdAt";
    const sortOrder = sortByOrder === "asc" ? 1 : -1;
    const sortOption = { [sortField]: sortOrder };

    // Fetch the category list
    const adminList = await Admin.find(query)
      .sort(sortOption)
      .limit(parseInt(pageCount))
      .skip(parseInt(pageNo - 1) * parseInt(pageCount))
      .populate({
        path: "role",
      });
    const totalCount = await Admin.countDocuments({});
    const activeCount = await Admin.countDocuments({status:true});
    const inactiveCount = await Admin.countDocuments({status:false});
    sendResponse(res, 200, "Success", {
      message: "Admin list retrieved successfully!",
      data: adminList,
      documentCount: {
        totalCount,activeCount,inactiveCount
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

module.exports = adminController;
