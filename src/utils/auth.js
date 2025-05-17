// const jwt = require("jsonwebtoken");
// const User = require("../model/user.Schema"); // Adjust the path based on your project structure

// const auth = async (req, res, next) => {
//   try {
//     const token = req.header("Authorization")?.replace("Bearer ", "");
//     if (!token) {
//       return res.status(401).json({ error: "Authentication token is required" });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_KEY); // Ensure JWT_KEY is set in your .env file

//     const user = await User.findOne({ token: token });
//     if (!user) {
//       return res.status(401).json({ error: "User not found or token is invalid" });
//     }

//     req.token = token;
//     req.user = user;
//     next();
//   } catch (e) {
//     res.status(401).json({ error: "Invalid authentication token" });
//   }
// };

// module.exports = auth;




const jwt = require("jsonwebtoken");
const User = require("../model/user.Schema");
const Vendor = require("../model/vender.Schema");
const Driver = require("../model/driver.Schema");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "Authentication token is required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_KEY);

    // Try finding user in each model
    const [user, vendor, driver] = await Promise.all([
      User.findOne({ token }),
      Vendor.findOne({ token }),
      Driver.findOne({ token }),
    ]);

    const account = user || vendor || driver;

    if (!account) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.token = token;
    req.user = account; // Could be user, vendor, or driver
    req.role = user ? "User" : vendor ? "Vendor" : "Driver"; // optional: to identify role
    next();
  } catch (e) {
    res.status(401).json({ error: "Invalid authentication token" });
  }
};

module.exports = auth;
