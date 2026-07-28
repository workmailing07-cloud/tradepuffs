import { Schema, model, models } from "mongoose";

const WithdrawWalletRequestSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        newAddress: { type: String, required: true, trim: true },
        newNetwork: { type: String, default: "Binance (TRC-20)", trim: true },
        status: {
            type: String,
            enum: ["PENDING", "APPROVED", "REJECTED"],
            default: "PENDING",
        },
        adminRemark: { type: String, default: "" },
    },
    { timestamps: true }
);

const WithdrawWalletRequest =
    models.WithdrawWalletRequest || model("WithdrawWalletRequest", WithdrawWalletRequestSchema);
export default WithdrawWalletRequest;
