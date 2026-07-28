import dbConnect from "@/lib/mongodb";
import SupportConfig from "@/lib/models/SupportConfig";
import { assertAdminPermission } from "@/lib/services/server/admin-auth.server";

function normalizeTelegramUsername(input: unknown): string {
    const raw = String(input || "").trim();
    if (!raw) return "";
    const withoutUrl = raw
        .replace(/^https?:\/\/t\.me\//i, "")
        .replace(/^@/, "")
        .split(/[/?#]/)[0]
        .trim();
    return withoutUrl.replace(/[^a-zA-Z0-9_]/g, "");
}

export const supportConfigServer = {
    normalizeTelegramUsername,

    async getPublicContact() {
        await dbConnect();
        const doc = await SupportConfig.findOne({ singletonKey: "default" }).lean();
        const username = normalizeTelegramUsername(doc?.telegramUsername || "");
        return {
            telegramUsername: username,
            telegramUrl: username ? `https://t.me/${username}` : "",
        };
    },

    async updateForAdmin(actorId: string, body: { telegramUsername?: string }) {
        await assertAdminPermission(actorId, "MANAGE_CS");
        await dbConnect();
        const username = normalizeTelegramUsername(body.telegramUsername || "");
        const updated = await SupportConfig.findOneAndUpdate(
            { singletonKey: "default" },
            { $set: { telegramUsername: username } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        ).lean();
        return {
            telegramUsername: normalizeTelegramUsername(updated?.telegramUsername || ""),
            telegramUrl: username ? `https://t.me/${username}` : "",
        };
    },

    async deleteForAdmin(actorId: string) {
        await assertAdminPermission(actorId, "MANAGE_CS");
        await dbConnect();
        await SupportConfig.deleteOne({ singletonKey: "default" });
        return {
            telegramUsername: "",
            telegramUrl: "",
        };
    },
};
