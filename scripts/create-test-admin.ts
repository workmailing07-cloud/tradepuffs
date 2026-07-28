/**
 * Create or refresh a super-admin test account.
 * Run: npm run create-test-admin
 *   or: npx tsx scripts/create-test-admin.ts
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const ADMIN_EMAIL = "testadmin@thetrade.com";
const ADMIN_PASSWORD = "TestAdmin123!";
const ADMIN_NAME = "Test Admin";

function loadEnv() {
    const envPath = resolve(ROOT, ".env.local");
    const text = readFileSync(envPath, "utf8");
    for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const idx = trimmed.indexOf("=");
        if (idx === -1) continue;
        const key = trimmed.slice(0, idx).trim();
        const value = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) process.env[key] = value;
    }
}

async function main() {
    loadEnv();
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI missing in .env.local");

    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });

    const { default: User } = await import("../src/lib/models/User");
    const { generateUniqueInviteCode } = await import("../src/lib/invitation");

    const email = ADMIN_EMAIL.toLowerCase();
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12);
    const existing = await User.findOne({ email });

    if (existing) {
        existing.name = ADMIN_NAME;
        existing.password = hashed;
        existing.plainPassword = ADMIN_PASSWORD;
        existing.role = "ADMIN";
        existing.staffRole = null;
        existing.status = "ACTIVE";
        if (!existing.invitationCode) {
            existing.invitationCode = await generateUniqueInviteCode(
                async (code) => !!(await User.exists({ invitationCode: code, _id: { $ne: existing._id } }))
            );
        }
        await existing.save();
        console.log("Updated existing admin account.");
    } else {
        const invitationCode = await generateUniqueInviteCode(
            async (code) => !!(await User.exists({ invitationCode: code }))
        );
        await User.create({
            name: ADMIN_NAME,
            email,
            password: hashed,
            plainPassword: ADMIN_PASSWORD,
            role: "ADMIN",
            staffRole: null,
            balance: 0,
            status: "ACTIVE",
            invitationCode,
        });
        console.log("Created new admin account.");
    }

    console.log("\n--- Login credentials ---");
    console.log(`Email:    ${ADMIN_EMAIL}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
    console.log(`Role:     ADMIN (full access)`);
    console.log("\nLogin at: /auth/login then open /dashboard/admin");

    await mongoose.disconnect();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
