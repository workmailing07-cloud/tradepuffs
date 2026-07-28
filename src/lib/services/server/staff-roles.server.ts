import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import StaffRole from "@/lib/models/StaffRole";
import User from "@/lib/models/User";
import { normalizePermissionList } from "@/lib/permissions";
import { assertAdminPermission, resolveAdminAccessForUserId } from "@/lib/services/server/admin-auth.server";

export const staffRolesServer = {
    async listForActor(actorId: string) {
        const access = await resolveAdminAccessForUserId(actorId);
        if (!access.ok) throw new Error("Forbidden");
        const canRoles = access.isSuperAdmin || access.permissionSet.has("MANAGE_ROLES");
        const canUsers = access.permissionSet.has("MANAGE_USERS");
        if (!canRoles && !canUsers) throw new Error("Forbidden");
        await dbConnect();
        return StaffRole.find().sort({ name: 1 }).lean();
    },

    async create(actorId: string, body: { name: string; description?: string; permissions?: string[] }) {
        await assertAdminPermission(actorId, "MANAGE_ROLES");
        await dbConnect();
        const name = String(body.name || "").trim();
        if (!name) throw new Error("Role name is required");
        const permissions = normalizePermissionList(body.permissions);
        try {
            const doc = await StaffRole.create({
                name,
                description: String(body.description || "").trim(),
                permissions,
            });
            return doc.toObject();
        } catch (e: any) {
            if (e?.code === 11000) throw new Error("A role with this name already exists");
            throw e;
        }
    },

    async update(actorId: string, id: string, body: { name?: string; description?: string; permissions?: string[] }) {
        await assertAdminPermission(actorId, "MANAGE_ROLES");
        await dbConnect();
        const role = await StaffRole.findById(id);
        if (!role) throw new Error("Role not found");
        if (typeof body.name === "string" && body.name.trim()) role.name = body.name.trim();
        if (typeof body.description === "string") role.description = body.description.trim();
        if (body.permissions !== undefined) role.permissions = normalizePermissionList(body.permissions);
        try {
            await role.save();
            return role.toObject();
        } catch (e: any) {
            if (e?.code === 11000) throw new Error("A role with this name already exists");
            throw e;
        }
    },

    async remove(actorId: string, id: string) {
        await assertAdminPermission(actorId, "MANAGE_ROLES");
        await dbConnect();
        const rid = new mongoose.Types.ObjectId(id);
        const inUse = await User.exists({ staffRole: rid });
        if (inUse) throw new Error("Cannot delete role while assigned to admins");
        const res = await StaffRole.findByIdAndDelete(id);
        if (!res) throw new Error("Role not found");
        return { success: true };
    },
};
