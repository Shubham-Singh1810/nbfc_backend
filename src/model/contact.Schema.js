const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");
const { type } = require("os");

const contactSchema = mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  contactNumber: {
    type: Number,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  subject:{
    type: String,
    required: true,
  },
  message:{
    type: String,
    required: true,
  },
  isResponded:{
    type:Boolean,
    default:false,
  },
  respondedVia:{
    type:String
  },
  note:{
    type:String
  },  
});

contactSchema.plugin(timestamps);
module.exports = mongoose.model("Contact", contactSchema);
