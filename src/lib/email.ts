import User from "@/lib/models/User";

export function normalizeEmail(email: string): string {
    return String(email || "").trim().toLowerCase();
}

function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Case-insensitive lookup; supports legacy mixed-case emails stored before normalization. */
export async function findUserByEmail(email: string) {
    const normalized = normalizeEmail(email);
    if (!normalized) return null;

    let user = await User.findOne({ email: normalized });
    if (user) return user;

    return User.findOne({
        email: { $regex: new RegExp(`^${escapeRegex(normalized)}$`, "i") },
    });
}

/** Persist lowercase email when a legacy record is found with different casing. */
export async function normalizeStoredEmailIfNeeded(user: { email: string; save: () => Promise<unknown> }) {
    const normalized = normalizeEmail(user.email);
    if (normalized && user.email !== normalized) {
        user.email = normalized;
        await user.save();
    }
}
