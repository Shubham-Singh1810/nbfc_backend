const jwt = require("jsonwebtoken");
const { sendResponse } = require("../utils/common");

const auth = (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return sendResponse(res, 401, "Failed", {
        message: "No token, authorization denied",
        
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    return sendResponse(res, 401, "Failed", {
      message: "Token is not valid or expired",
    });
  }
};

module.exports = auth;
