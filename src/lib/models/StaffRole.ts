import mongoose, { Schema, model, models } from "mongoose";

const StaffRoleSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, default: "" },
        permissions: [{ type: String }],
    },
    { timestamps: true }
);

StaffRoleSchema.index({ name: 1 }, { unique: true });

const StaffRole = models.StaffRole || model("StaffRole", StaffRoleSchema);
export default StaffRole;
