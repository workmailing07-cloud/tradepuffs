import mongoose, { Schema, model, models } from "mongoose";

const TransactionSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["DEPOSIT", "WITHDRAW"], required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["PENDING", "COMPLETED", "FAILED", "REJECTED"], default: "PENDING" },
    // For deposits: reference note or screenshot description the user sends to CS
    screenshotNote: { type: String, default: "" },
    // Deposit address used for this transaction (snapshot at time of request)
    depositAddress: { type: String, default: "" },
    // Withdraw: user's wallet address + network label
    withdrawAddress: { type: String, default: "" },
    withdrawNetwork: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
});

const Transaction = models.Transaction || model("Transaction", TransactionSchema);
export default Transaction;
