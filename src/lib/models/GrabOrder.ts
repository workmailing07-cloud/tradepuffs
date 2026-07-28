import mongoose, { Schema, model, models } from "mongoose";

const GrabOrderSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    productName: { type: String, required: true },
    productImage: { type: String },
    items: [{
        name: { type: String },
        image: { type: String },
        price: { type: Number },
        quantity: { type: Number }
    }],
    price: { type: Number, required: true },
    commission: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ["PENDING", "COMPLETED", "COMBO", "CANCELLED"], 
        default: "PENDING" 
    },
    isCombo: { type: Boolean, default: false },
    isAdminAuthorized: { type: Boolean, default: false },
    authorizedAmount: { type: Number, default: 0 },
    requiredDeposit: { type: Number, default: 0 },
    /** Approved deposits credited toward this combo's requiredDeposit (not wallet balance). */
    depositedAmount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
});

const GrabOrder = models.GrabOrder || model("GrabOrder", GrabOrderSchema);
export default GrabOrder;
