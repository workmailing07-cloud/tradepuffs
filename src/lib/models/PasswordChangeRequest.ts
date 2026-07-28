import { Schema, model, models } from "mongoose";

const PasswordChangeRequestSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        newPassword: { type: String, required: true },
        status: {
            type: String,
            enum: ["PENDING", "APPROVED", "REJECTED"],
            default: "PENDING",
        },
        adminRemark: { type: String, default: "" },
    },
    { timestamps: true }
);

const PasswordChangeRequest =
    models.PasswordChangeRequest || model("PasswordChangeRequest", PasswordChangeRequestSchema);
export default PasswordChangeRequest;
