const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");
const { type } = require("os");

const systemConfigrationSchema = mongoose.Schema({
  isPaydayLoanActive: {
    type: Boolean,
  },
   isRegularLoanActive: {
    type: Boolean,
  }, 
});

systemConfigrationSchema.plugin(timestamps);
module.exports = mongoose.model("SystemConfigration", systemConfigrationSchema);
