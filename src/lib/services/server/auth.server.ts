import User from "@/lib/models/User";
import dbConnect from "@/lib/mongodb";
import { DEFAULT_ADMIN_INVITATION_CODE, generateUniqueInviteCode } from "@/lib/invitation";
import { findUserByEmail, normalizeEmail } from "@/lib/email";
import { hashPassword } from "@/lib/password";

export const authServerService = {
    async ensureAdminInvitationCode() {
        const admin = await User.findOne({ role: "ADMIN" }).sort({ createdAt: 1 });
        if (!admin) return null;

        if (admin.invitationCode) {
            return admin;
        }

        const inviteCode = await generateUniqueInviteCode(
            async (code) => !!(await User.exists({ invitationCode: code })),
            DEFAULT_ADMIN_INVITATION_CODE
        );

        admin.invitationCode = inviteCode;
        await admin.save();
        return admin;
    },

    async registerUser(data: any) {
        const name = String(data.name || "").trim();
        const email = normalizeEmail(data.email);
        const password = String(data.password || "");
        const invitationCode = String(data.invitationCode || "").trim().toUpperCase();

        if (!name || !email || !password) {
            throw new Error("Name, email, and password are required");
        }

        await dbConnect();

        const userCount = await User.countDocuments();
        const existingAdmin = await this.ensureAdminInvitationCode();

        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            throw new Error("User already exists");
        }

        if (userCount === 0) {
            const hashedPassword = await hashPassword(password);
            const adminCode = await generateUniqueInviteCode(
                async (code) => !!(await User.exists({ invitationCode: code })),
                DEFAULT_ADMIN_INVITATION_CODE
            );

            const firstAdmin = await User.create({
                name,
                email,
                password: hashedPassword,
                plainPassword: password,
                role: "ADMIN",
                invitationCode: adminCode,
            });

            return { id: firstAdmin._id, role: "ADMIN", invitationCode: adminCode };
        }

        if (!invitationCode) {
            throw new Error("Invitation code is required");
        }

        const inviter = await User.findOne({ invitationCode });
        if (!inviter) {
            throw new Error("Invalid invitation code");
        }

        const hashedPassword = await hashPassword(password);
        const newUserInvitationCode = await generateUniqueInviteCode(
            async (code) => !!(await User.exists({ invitationCode: code }))
        );

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            plainPassword: password,
            invitationCode: newUserInvitationCode,
            invitedByCode: invitationCode,
            invitedBy: inviter._id,
        });

        await User.findByIdAndUpdate(inviter._id, { $inc: { totalInvites: 1 } });
        // Keep a deterministic admin invite code available for all future signups.
        if (!existingAdmin) {
            await this.ensureAdminInvitationCode();
        }

        return { id: newUser._id, invitationCode: newUserInvitationCode };
    },
};
