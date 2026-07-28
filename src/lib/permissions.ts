/** Canonical admin permission identifiers (stored on StaffRole and checked in APIs). */

export const ADMIN_PERMISSION_META = [
    { id: "MANAGE_TRANSACTIONS", label: "Approve / reject deposits & withdrawals" },
    { id: "MANAGE_CS", label: "Customer support ticket requests" },
    { id: "MANAGE_TASK_REQUESTS", label: "Daily task batch requests & combo approval" },
    { id: "MANAGE_DEPOSIT_ADDRESSES", label: "Deposit wallet addresses" },
    { id: "MANAGE_INVITATIONS", label: "Invitation codes & invite tree" },
    { id: "MANAGE_USERS", label: "Create, edit, delete users" },
    { id: "MANAGE_PRODUCTS", label: "Spinner / grab catalog products & uploads" },
    { id: "MANAGE_PASSWORD_REQUESTS", label: "User password-change approvals" },
    { id: "MANAGE_WITHDRAW_WALLET_REQUESTS", label: "User withdrawal wallet address change approvals" },
    { id: "VIEW_HISTORY", label: "Global activity & transaction history timeline" },
    { id: "MANAGE_ROLES", label: "Create roles & assign permission sets" },
] as const;

export type AdminPermissionId = (typeof ADMIN_PERMISSION_META)[number]["id"];

export const ALL_ADMIN_PERMISSION_IDS: AdminPermissionId[] = ADMIN_PERMISSION_META.map((x) => x.id);

export const ADMIN_PERMISSION_IDS_SET = new Set<string>(ALL_ADMIN_PERMISSION_IDS);

export function isValidPermissionId(id: unknown): id is AdminPermissionId {
    return typeof id === "string" && ADMIN_PERMISSION_IDS_SET.has(id);
}

export function normalizePermissionList(input: unknown): AdminPermissionId[] {
    if (!Array.isArray(input)) return [];
    const out: AdminPermissionId[] = [];
    for (const x of input) {
        if (isValidPermissionId(x) && !out.includes(x)) out.push(x);
    }
    return out;
}
