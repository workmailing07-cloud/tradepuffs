/**
 * Emails listed here always get full admin (super admin) permission resolution,
 * even if a staffRole document was attached by mistake.
 *
 * Comma-separated env: SUPER_ADMIN_EMAILS=alice@example.com,bob@example.com
 */

const DEFAULT_SUPER_ADMIN_EMAILS = "superadmin@thetrade.com";

export function getSuperAdminEmailSet(): ReadonlySet<string> {
    const raw = process.env.SUPER_ADMIN_EMAILS ?? DEFAULT_SUPER_ADMIN_EMAILS;
    const list = raw
        .split(/[,;\s]+/)
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
    return new Set(list);
}

export function isSuperAdminEmail(email: unknown): boolean {
    if (!email || typeof email !== "string") return false;
    return getSuperAdminEmailSet().has(email.trim().toLowerCase());
}
