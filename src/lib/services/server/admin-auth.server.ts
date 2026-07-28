import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
/** Required so populate("staffRole") works when this module loads before admin routes. */
import "@/lib/models/StaffRole";
import { ALL_ADMIN_PERMISSION_IDS } from "@/lib/permissions";
import { isSuperAdminEmail } from "@/lib/super-admin";

export type ResolvedAdminAccess =
    | { ok: false }
    | {
          ok: true;
          userId: string;
          isSuperAdmin: boolean;
          permissionSet: ReadonlySet<string>;
      };

export async function resolveAdminAccessForUserId(userId: string): Promise<ResolvedAdminAccess> {
    await dbConnect();
    const user = await User.findById(userId).populate("staffRole").lean();
    if (!user || user.role !== "ADMIN") return { ok: false };

    const emailNorm = typeof (user as any).email === "string" ? String((user as any).email).trim().toLowerCase() : "";
    if (emailNorm && isSuperAdminEmail(emailNorm)) {
        return {
            ok: true,
            userId,
            isSuperAdmin: true,
            permissionSet: new Set(ALL_ADMIN_PERMISSION_IDS),
        };
    }

    const sr = user.staffRole as { _id?: unknown; permissions?: string[] } | null | undefined;
    if (!sr) {
        return {
            ok: true,
            userId,
            isSuperAdmin: true,
            permissionSet: new Set(ALL_ADMIN_PERMISSION_IDS),
        };
    }

    const perms = Array.isArray(sr.permissions) ? sr.permissions.filter((p) => typeof p === "string") : [];
    return {
        ok: true,
        userId,
        isSuperAdmin: false,
        permissionSet: new Set(perms),
    };
}

export function adminHasPermission(access: ResolvedAdminAccess, permission: string): boolean {
    if (!access.ok) return false;
    if (access.isSuperAdmin) return true;
    return access.permissionSet.has(permission);
}

export async function assertAdminPermission(userId: string, permission: string): Promise<ResolvedAdminAccess> {
    const access = await resolveAdminAccessForUserId(userId);
    if (!access.ok) throw new Error("Forbidden");
    if (!adminHasPermission(access, permission)) throw new Error("Forbidden");
    return access;
}
