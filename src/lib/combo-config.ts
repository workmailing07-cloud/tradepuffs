export type ComboConfigEntry = {
    grabIndex: number;
    requiredDeposit: number;
};

export function normalizeComboConfig(raw: unknown): ComboConfigEntry[] {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((entry) => {
            const item = entry as { grabIndex?: unknown; requiredDeposit?: unknown };
            return {
                grabIndex: Math.floor(Number(item.grabIndex)),
                requiredDeposit: Math.max(0, parseFloat((Number(item.requiredDeposit) || 0).toFixed(2))),
            };
        })
        .filter((entry) => entry.grabIndex >= 1 && entry.grabIndex <= 25);
}

export function findComboSetting(
    comboConfig: ComboConfigEntry[] | undefined,
    grabIndex: number
): ComboConfigEntry | undefined {
    return comboConfig?.find((entry) => Number(entry.grabIndex) === grabIndex);
}
