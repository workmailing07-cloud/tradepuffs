import { Schema, model, models } from "mongoose";

const CSRequestSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    orderId: { type: Schema.Types.ObjectId, ref: "GrabOrder" },
    type: { 
        type: String, 
        enum: ["COMBO_UNLOCK", "WITHDRAWAL_HELP", "DEPOSIT_HELP", "OTHER"], 
        default: "COMBO_UNLOCK" 
    },
    message: { type: String },
    screenshotUrl: { type: String, default: "" },
    screenshotPublicId: { type: String, default: "" },
    depositAmount: { type: Number, default: 0 },
    status: { 
        type: String, 
        enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "REJECTED"], 
        default: "OPEN" 
    },
    adminRemark: { type: String },
    userNotified: { type: Boolean, default: false },
}, { 
    timestamps: true 
});

const CSRequest = models.CSRequest || model("CSRequest", CSRequestSchema);
export default CSRequest;
