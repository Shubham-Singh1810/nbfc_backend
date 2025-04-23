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
    signature: {
        type: String,
        require: true,
    },
    orderId: {
        type: String,
        require: true,
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
        driverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Driver",
            required: true, 
        },
    }],
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true, 
    },
    addressId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
        required: true, 
    },
});

bookingSchema.plugin(timestamps);
module.exports = mongoose.model("Booking", bookingSchema);