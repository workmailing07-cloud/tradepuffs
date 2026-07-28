import mongoose, { Schema, model, models } from "mongoose";

// Admin sets one "global" address (or per-user override) for USDT deposits.
// The most recently created active record is used as the current address.
const DepositAddressSchema = new Schema({
    address: { type: String, required: true },
    network: { type: String, default: "TRON (TRC-20)" },
    // null = global; ObjectId = per-user override
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const DepositAddress = models.DepositAddress || model("DepositAddress", DepositAddressSchema);
export default DepositAddress;
