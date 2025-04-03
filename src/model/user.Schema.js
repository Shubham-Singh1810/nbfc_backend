const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");
const { type } = require("os");

const userSchema = mongoose.Schema({
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  email: {
    type: String,
  },
  password: {
    type: String,
  },
  emailOtp: {
    type: String,
  },
  phoneOtp: {
    type: String,
  },
  token: {
    type: String,
  },
  phone: {
    type: String,
    required: true,
  },
  profilePic: {
    type: String,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  isPhoneVerified: {
    type: Boolean,
    default: false,
  },
  countryCode: {
    type: String,
    default: "91",
  },
  profileStatus:{
    type: String,
    default: "incompleted",
      enum: ["incompleted", "completed"],
  },
  pincode: {
    type: String,
  },
  address: {
    type: String,
  },
  cartItems:  [{productId:{ type: String, ref: "Product" },quantity:{ type: Number }}],
  wishListItems: [{ type: String, ref: "Product" }],
});

userSchema.plugin(timestamps);
module.exports = mongoose.model("User", userSchema);
