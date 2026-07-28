import bcrypt from "bcryptjs";

export function isBcryptHash(value: string): boolean {
    return /^\$2[aby]\$/.test(value);
}

export async function verifyPassword(plain: string, stored: string | null | undefined): Promise<boolean> {
    if (!stored) return false;
    const digest = String(stored);
    if (isBcryptHash(digest)) {
        return bcrypt.compare(plain, digest);
    }
    /** Legacy accounts may have a plain-text password in the database. */
    return plain === digest;
}

export async function hashPassword(plain: string, rounds = 12): Promise<string> {
    return bcrypt.hash(plain, rounds);
}
