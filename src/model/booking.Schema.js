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
    bookingQuantity:{
        type: String
    },
    bookingPrice:{
        type: String
    },
    modeOfPayment:{
        type: String,
        enum: ["COD", "Online"],
    },
    paymentId:{
        type: String
    },
    product:  [
        {productId:{ type: String, ref: "Product" },
        quantity:{ type: Number },
        totalPrice:{ type: Number },
        deliveryStatus:{ type: Boolean, default:false },
    }],
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true, 
    },
});

bookingSchema.plugin(timestamps);
module.exports = mongoose.model("Booking", bookingSchema);