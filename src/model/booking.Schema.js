const mongoose = require("mongoose");
const timestamps = require("mongoose-timestamp");

const bookingSchema = mongoose.Schema({
    totalAmount: {
        type: String,
    },
    status: {
        type: String,
        require: true,
    },
    product:  [{productId:{ type: String, ref: "Product" },quantity:{ type: Number }}],
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true, 
    },
});

bookingSchema.plugin(timestamps);
module.exports = mongoose.model("Booking", bookingSchema);