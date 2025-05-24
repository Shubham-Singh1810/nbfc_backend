const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");
const { type } = require("os");

const adminSchema = mongoose.Schema({
  profilePic: {
    type: String,
  },
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  email: {
    type: String,
  },
  phone: {
    type: Number,
    required: true,
  },
  password: {
    type: String,
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role",
    required: true,
  },
  deviceId:{
    type: String
  }
});

adminSchema.plugin(timestamps);
module.exports = mongoose.model("Admin", adminSchema);
