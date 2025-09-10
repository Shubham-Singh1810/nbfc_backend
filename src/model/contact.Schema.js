const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");
const { type } = require("os");

const contactSchema = mongoose.Schema({
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  contactNumber: {
    type: Number,
  },
  email: {
    type: String,
  },
  subject:{
    type: String,
  },
  message:{
    type: String,
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
