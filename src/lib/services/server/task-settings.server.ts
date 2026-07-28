import dbConnect from "@/lib/mongodb";
import TaskSettings from "@/lib/models/TaskSettings";
import { assertAdminPermission } from "@/lib/services/server/admin-auth.server";

const DEFAULT_REQUEST_COOLDOWN_MINUTES = 20;

function normalizeCooldownMinutes(input: unknown): number {
    const value = Number(input);
    if (!Number.isFinite(value) || value < 0) return DEFAULT_REQUEST_COOLDOWN_MINUTES;
    return Math.floor(value);
}

export const taskSettingsServer = {
    defaultRequestCooldownMinutes: DEFAULT_REQUEST_COOLDOWN_MINUTES,
    normalizeCooldownMinutes,

    async getSettings() {
        await dbConnect();
        const doc = await TaskSettings.findOne({ singletonKey: "default" }).lean();
        return {
            requestCooldownMinutes: normalizeCooldownMinutes(
                doc?.requestCooldownMinutes ?? DEFAULT_REQUEST_COOLDOWN_MINUTES
            ),
        };
    },

    async updateForAdmin(actorId: string, body: { requestCooldownMinutes?: unknown }) {
        await assertAdminPermission(actorId, "MANAGE_TASK_REQUESTS");
        await dbConnect();

        const requestCooldownMinutes = normalizeCooldownMinutes(body.requestCooldownMinutes);
        const updated = await TaskSettings.findOneAndUpdate(
            { singletonKey: "default" },
            { $set: { requestCooldownMinutes } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        ).lean();

        return {
            requestCooldownMinutes: normalizeCooldownMinutes(updated?.requestCooldownMinutes),
        };
    },
};
