import mongoose, { Schema, model, models } from "mongoose";

const UserSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    plainPassword: { type: String, default: "" },
    balance: { type: Number, default: 0 },
    role: { type: String, enum: ["USER", "ADMIN"], default: "USER" },
    /** When set on an ADMIN account, restricts actions to StaffRole.permissions. Unset/null = full (super) admin. */
    staffRole: { type: Schema.Types.ObjectId, ref: "StaffRole", default: null },
    dailyTasksCompleted: { type: Number, default: 0 },
    maxDailyTasks: { type: Number, default: 25 },
    lastGrabDate: { type: Date, default: Date.now },
    totalCommission: { type: Number, default: 0 },
    dailyCommission: { type: Number, default: 0 },
    status: { type: String, enum: ["ACTIVE", "FROZEN", "PENDING_COMBO"], default: "ACTIVE" },
    taskRequestStatus: { 
        type: String, 
        enum: ["NONE", "PENDING", "APPROVED"], 
        default: "NONE" 
    },
    comboConfig: [{
        grabIndex: { type: Number }, // 1 to 25
        requiredDeposit: { type: Number, default: 0 }
    }],
    invitationCode: { type: String, unique: true, sparse: true, uppercase: true, trim: true },
    invitedByCode: { type: String, uppercase: true, trim: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User" },
    totalInvites: { type: Number, default: 0 },
    /** Saved USDT withdrawal address (set once in Wallet Management; changes require admin approval). */
    savedWithdrawAddress: { type: String, default: "" },
    savedWithdrawNetwork: { type: String, default: "Binance (TRC-20)" },
    createdAt: { type: Date, default: Date.now },
});

const User = models.User || model("User", UserSchema);
export default User;
