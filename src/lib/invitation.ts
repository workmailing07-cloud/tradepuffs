const INVITE_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const DEFAULT_ADMIN_INVITATION_CODE =
    (process.env.DEFAULT_ADMIN_INVITATION_CODE || "641DAA").toUpperCase();

function randomInviteCode(length = 6): string {
    let out = "";
    for (let i = 0; i < length; i += 1) {
        out += INVITE_CODE_CHARS.charAt(Math.floor(Math.random() * INVITE_CODE_CHARS.length));
    }
    return out;
}

export async function generateUniqueInviteCode(
    exists: (code: string) => Promise<boolean>,
    preferredCode?: string
): Promise<string> {
    const normalizedPreferred = preferredCode?.trim().toUpperCase();
    if (normalizedPreferred && !(await exists(normalizedPreferred))) {
        return normalizedPreferred;
    }

    for (let i = 0; i < 60; i += 1) {
        const code = randomInviteCode(6);
        if (!(await exists(code))) return code;
    }

    throw new Error("Could not generate invitation code, please retry");
}
