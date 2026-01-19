const express = require("express");
const { sendResponse } = require("../utils/common");
require("dotenv").config();
const Admin = require("../model/admin.Schema");
const User = require("../model/user.Schema");
const Faq = require("../model/faq.Schema");
const LoanPurpose = require("../model/loanPurpose.Schema");
const Branch = require("../model/branch.Schema");
const Ticket = require("../model/ticket.Schema");
const adminController = express.Router();
require("dotenv").config();
const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendMail } = require("../utils/common");
const auth = require("../middleware/auth");

function generateAdminPassword(length = 8) {
  if (length < 8) {
    throw new Error("Password length must be at least 8 characters");
  }

  const upperCase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowerCase = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const special = "!@#$%^&*()_+[]{}|;:,.<>?";

  // ensure at least one of each rule
  let password = "";
  password += upperCase.charAt(Math.floor(Math.random() * upperCase.length));
  password += lowerCase.charAt(Math.floor(Math.random() * lowerCase.length));
  password += digits.charAt(Math.floor(Math.random() * digits.length));
  password += special.charAt(Math.floor(Math.random() * special.length));

  // fill remaining chars with all sets combined
  const allChars = upperCase + lowerCase + digits + special;
  for (let i = password.length; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  // shuffle password so required chars are not in fixed positions
  password = password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");

  return password;
}

adminController.post(
  "/create",
  auth,
  upload.single("profilePic"),
  async (req, res) => {
    try {
      let { ...rest } = req.body;
      if (rest.email) {
        const emailExists = await Admin.findOne({ email: rest.email });
        if (emailExists) {
          return sendResponse(res, 400, "Failed", {
            message: "Email already exists. Please use another email.",
            statusCode: 400,
          });
        }
      }
      if (rest.phone) {
        const phoneExists = await Admin.findOne({ phone: rest.phone });
        if (phoneExists) {
          return sendResponse(res, 400, "Failed", {
            message:
              "Phone number already exists. Please use another phone number.",
            statusCode: 400,
          });
        }
      }
      if (rest.branch) {
        if (typeof rest.branch === "string") {
          try {
            // 🔹 Case 1: JSON string — '["id1","id2"]'
            const parsed = JSON.parse(rest.branch);
            rest.branch = Array.isArray(parsed) ? parsed : [parsed];
          } catch (err) {
            // 🔹 Case 2: Comma-separated string — "id1,id2"
            rest.branch = rest.branch.split(",").map((b) => b.trim());
          }
        } else if (!Array.isArray(rest.branch)) {
          rest.branch = [rest.branch];
        }
      }
      const plainPassword = generateAdminPassword();

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
        process.env.JWT_KEY,
        { expiresIn: "24h" }, // Add this line
      );

      // ✅ Store token in DB
      const updatedAdmin = await Admin.findByIdAndUpdate(
        AdminData._id,
        { token },
        { new: true },
      );
      const html = `
  <div style="font-family: Arial, sans-serif; line-height:1.5; color:#222;">
    <h2 style="color:#0b5ed7; margin-bottom:0.2rem;">Welcome to Rupee Loan, ${req.body?.firstName}!</h2>
    <p>Congratulations — your admin account has been created successfully.</p>

    <p><strong>Login details</strong><br/>
      Email: ${req?.body?.email}<br/>
      Password: <strong style="font-size:1.1rem;">${plainPassword}</strong>
    </p>

    <p style="margin-top:0.5rem;">
      For security, please change this Password after your first login. If you didn't request this account, contact our support immediately.
    </p>

    <hr style="border:none; border-top:1px solid #eee; margin:1rem 0;" />

    <p style="font-size:0.95rem; color:#666;">Regards,<br/>Rupee Loan Team</p>
  </div>
`;

      await sendMail(
        req.body.email,
        "Welcome to Rupee Loan — Your Admin Account Details",
        html,
      );
      sendResponse(res, 200, "Success", {
        message: "Staff created successfully!",
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
  },
);

adminController.put(
  "/update",
  auth,
  upload.single("profilePic"),
  async (req, res) => {
    try {
      const id = req.body._id;
      const adminData = await Admin.findById(id);

      if (!adminData) {
        return sendResponse(res, 404, "Failed", {
          message: "Admin not found",
        });
      }

      let updatedData = { ...req.body };

      if (updatedData.email && updatedData.email !== adminData.email) {
        const emailExists = await Admin.findOne({
          email: updatedData.email,
          _id: { $ne: id },
        });
        if (emailExists) {
          return sendResponse(res, 400, "Failed", {
            message: "Email already exists. Please use another email.",
          });
        }
      }

      if (updatedData.phone && updatedData.phone !== adminData.phone) {
        const phoneExists = await Admin.findOne({
          phone: updatedData.phone,
          _id: { $ne: id },
        });
        if (phoneExists) {
          return sendResponse(res, 400, "Failed", {
            message:
              "Phone number already exists. Please use another phone number.",
          });
        }
      }

      if (updatedData.branch) {
        if (typeof updatedData.branch === "string") {
          try {
            // handle cases like: '["id1", "id2"]' or 'id1,id2'
            const parsed = JSON.parse(updatedData.branch);
            updatedData.branch = Array.isArray(parsed)
              ? parsed
              : [updatedData.branch];
          } catch {
            updatedData.branch = updatedData.branch.split(",");
          }
        }
      } else {
        updatedData.branch = []; // No branches selected
      }

      if (req.file) {
        if (adminData.profilePic) {
          const publicId = adminData.profilePic.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(publicId, (error, result) => {
            if (error) {
              console.error("Error deleting old image from Cloudinary:", error);
            } else {
              console.log("Old image deleted from Cloudinary:", result);
            }
          });
        }
        const image = await cloudinary.uploader.upload(req.file.path);
        updatedData.profilePic = image.url;
      }

      const updatedAdmin = await Admin.findByIdAndUpdate(id, updatedData, {
        new: true,
      });

      sendResponse(res, 200, "Success", {
        message: "Admin updated successfully!",
        data: updatedAdmin,
        statusCode: 200,
      });
    } catch (error) {
      console.error(error);
      sendResponse(res, 500, "Failed", {
        message: error.message || "Internal server error",
      });
    }
  },
);

adminController.delete("/delete/:id", auth, async (req, res) => {
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
    if (!user.status) {
      return sendResponse(res, 422, "Failed", {
        message: "Your account has been marked as inactive!",
        statusCode: 422,
      });
    }

    const token = jwt.sign(
      { userId: user._id, phone: user.phone },
      process.env.JWT_KEY,
      { expiresIn: "1m" },
    );

    let updatedAdmin = await Admin.findByIdAndUpdate(
      user._id,
      { deviceId, token },
      { new: true },
    ).populate({ path: "role" });

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

adminController.post("/list", auth, async (req, res) => {
  try {
    const {
      searchKey = "",
      status,
      pageNo = 1,
      pageCount = 10,
      sortByField,
      sortByOrder,
      branch,
      role,
    } = req.body;

    const query = {};

    if (status) query.status = status;
    if (role) query.role = role;

    // ✅ Handle branch filter (array or single)
    if (branch) {
      if (Array.isArray(branch)) {
        query.branch = { $in: branch };
      } else {
        query.branch = branch;
      }
    }

    if (searchKey) {
      query.$or = [
        { firstName: { $regex: searchKey, $options: "i" } },
        { lastName: { $regex: searchKey, $options: "i" } },
        { email: { $regex: searchKey, $options: "i" } },
      ];

      // ✅ phone search even if phone is Number
      if (/^\d+$/.test(searchKey)) {
        query.$or.push({
          $expr: {
            $regexMatch: {
              input: { $toString: "$phone" },
              regex: searchKey,
            },
          },
        });
      }
    }

    // ✅ Sorting setup
    const sortField = sortByField || "createdAt";
    const sortOrder = sortByOrder === "asc" ? 1 : -1;
    const sortOption = { [sortField]: sortOrder };

    // ✅ Fetch list with populate (works for array too)
    const adminList = await Admin.find(query)
      .sort(sortOption)
      .limit(parseInt(pageCount))
      .skip((parseInt(pageNo) - 1) * parseInt(pageCount))
      .populate({
        path: "role",
        select: "name", // optional: only select certain fields
      })
      .populate({
        path: "branch",
        select: "name location", // ✅ multiple branch details
      });

    const totalCount = await Admin.countDocuments({});
    const activeCount = await Admin.countDocuments({ status: true });
    const inactiveCount = await Admin.countDocuments({ status: false });

    sendResponse(res, 200, "Success", {
      message: "Admin list retrieved successfully!",
      data: adminList,
      documentCount: { totalCount, activeCount, inactiveCount },
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});

adminController.get("/details/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const adminDetails = await Admin.findOne({ _id: id })
      .populate({
        path: "role",
      })
      .populate({
        path: "branch",
      });
    sendResponse(res, 200, "Success", {
      message: "Admin Details retrived successfully",
      data: adminDetails,
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
adminController.put("/update-password", auth, async (req, res) => {
  try {
    const id = req.body._id;
    const adminData = await Admin.findById(id);

    if (!adminData) {
      return sendResponse(res, 404, "Failed", {
        message: "Admin not found",
        statusCode: "404",
      });
    }
    const isMatch = await bcrypt.compare(
      req?.body?.oldPassword,
      adminData?.password,
    );
    console.log(adminData?.password);
    if (!isMatch) {
      return sendResponse(res, 404, "Failed", {
        message: "Old password not matched",
      });
    }
    const hashedPassword = await bcrypt.hash(req?.body?.newPassword, 10);
    let updatedData = { password: hashedPassword };

    const updatedAdmin = await Admin.findByIdAndUpdate(id, updatedData, {
      new: true,
    });

    sendResponse(res, 200, "Success", {
      message: "Admin password updated successfully!",
      data: updatedAdmin,
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
    });
  }
});

adminController.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return sendResponse(res, 404, "Failed", {
        message: "Admin not found",
        statusCode: 404,
      });
    }

    // 🔐 Generate encrypted token (5 min validity)
    const resetToken = jwt.sign(
      { adminId: admin._id },
      process.env.RESET_PASSWORD_SECRET,
      { expiresIn: "15m" },
    );

    // ⏰ Save token & expiry in DB
    admin.resetPasswordToken = resetToken;
    admin.resetPasswordExpire = Date.now() + 5 * 60 * 1000;
    await admin.save();

    // 🔗 Reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/update-password/${resetToken}`;

    const html = `
        <div style="font-family: Arial, sans-serif; line-height:1.5;">
          <h3>Reset Your Password</h3>
          <p>You requested to reset your admin password.</p>
          <p><b>This link is valid for 15 minutes only.</b></p>
          <a href="${resetUrl}" style="color:#0b5ed7;">Click here to update password</a>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `;

    await sendMail(
      admin.email,
      "Reset Password – Rupee Loan (Valid for 15 minutes)",
      html,
    );

    sendResponse(res, 200, "Success", {
      message: "Reset password link sent successfully on email!",
      statusCode: 200,
    });
  } catch (error) {
    sendResponse(res, 500, "Failed", {
      message: error.message || "Internal server error",
      statusCode: 500,
    });
  }
});

adminController.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return sendResponse(res, 400, "Failed", {
        message: "Password is required",
        statusCode: 400,
      });
    }

    // 🔍 Verify JWT token
    const decoded = jwt.verify(token, process.env.RESET_PASSWORD_SECRET);

    const admin = await Admin.findOne({
      _id: decoded.adminId,
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!admin) {
      return sendResponse(res, 400, "Failed", {
        message: "Token is invalid or expired",
        statusCode: 400,
      });
    }

    // 🔐 Encrypt new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Update password & clear token
    admin.password = hashedPassword;
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpire = undefined;

    await admin.save();

    sendResponse(res, 200, "Success", {
      message: "Password updated successfully. Please login again.",
      statusCode: 200,
    });
  } catch (error) {
    sendResponse(res, 400, "Failed", {
      message: "Reset link expired or invalid",
      statusCode: 400,
    });
  }
});

adminController.post("/global-search", auth, async (req, res) => {
  try {
    const { searchKey } = req.body;

    if (!searchKey) {
      return sendResponse(res, 400, "Failed", {
        message: "Search key is required",
        statusCode: 400,
      });
    }

    const regex = new RegExp(searchKey, "i"); // case-insensitive

    const [users, staff, branches, loanPurposes, faqs, tickets] =
      await Promise.all([
        User.find({
          $or: [{ firstName: regex }, { email: regex }, { lastName: regex }],
        })
          .select("_id firstName lastName profilePic email")
          .limit(5),

        Admin.find({
          $or: [{ firstName: regex }, { email: regex }],
        })
          .select("_id firstName")
          .limit(5),

        Branch.find({
          name: regex,
        })
          .select("_id name")
          .limit(5),

        LoanPurpose.find({
          title: regex,
        })
          .select("_id name")
          .limit(5),

        Faq.find({
          question: regex,
        })
          .select("_id question")
          .limit(5),

        Ticket.find({
          $or: [{ subject: regex }],
        })
          .select("_id  subject")
          .limit(5),
      ]);

    sendResponse(res, 200, "Success", {
      message: "Search results",
      data: { users, staff, branches, loanPurposes, faqs, tickets },
      statusCode: 200,
    });
  } catch (error) {
    console.error("Global Search Error:", error);
    return sendResponse(res, 500, "Failed", {
      message: "Something went wrong",
      statusCode: 500,
    });
  }
});

module.exports = adminController;
