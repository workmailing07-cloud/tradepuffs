/** Admin-set combo deposit target (0 is valid). */
export function getComboAdminAmount(params: {
    isCombo: boolean;
    requiredDeposit?: number | null;
    storedPrice?: number;
}): number {
    if (!params.isCombo) {
        return Math.max(0, Number(params.storedPrice) || 0);
    }
    if (params.requiredDeposit !== undefined && params.requiredDeposit !== null) {
        const parsed = Number(params.requiredDeposit);
        if (Number.isFinite(parsed)) return Math.max(0, parseFloat(parsed.toFixed(2)));
    }
    return Math.max(0, Number(params.storedPrice) || 0);
}

/**
 * Combo orders show the admin-configured required deposit exactly (including 0).
 * Regular orders use `storedPrice` as-is.
 */
export function getDisplayedOrderAmount(params: {
    isCombo: boolean;
    storedPrice: number;
    requiredDeposit?: number | null;
}): number {
    return getComboAdminAmount({
        isCombo: params.isCombo,
        requiredDeposit: params.requiredDeposit,
        storedPrice: params.storedPrice,
    });
}

/** Expected amount = order amount line + commission (no double-counting balance). */
export function getOrderSummaryTotal(orderAmount: number, commission: number): number {
    const amount = Math.max(0, Number(orderAmount) || 0);
    const comm = Math.max(0, Number(commission) || 0);
    return parseFloat((amount + comm).toFixed(2));
}

/** Combo: order amount shown to user = balance + remaining required deposit. */
export function getComboOrdersAmount(balance: number, remainingDeposit: number): number {
    return parseFloat(((Number(balance) || 0) + (Number(remainingDeposit) || 0)).toFixed(2));
}

export const COMBO_COMMISSION_RATE = 0.55;
export const NORMAL_COMMISSION_RATE = 0.25;

/** Commission is always a % of the order amount (not wallet balance). */
export function getOrderCommission(orderAmount: number, isCombo: boolean): number {
    const amount = Math.max(0, Number(orderAmount) || 0);
    if (amount <= 0) return 0;
    const rate = isCombo ? COMBO_COMMISSION_RATE : NORMAL_COMMISSION_RATE;
    const raw = amount * rate;
    return Math.max(parseFloat(raw.toFixed(4)), 0.5);
}

/** How much more the user must deposit toward this combo (independent of wallet balance). */
export function getComboRemainingDeposit(requiredDeposit: number, depositedAmount: number): number {
    const required = Math.max(0, Number(requiredDeposit) || 0);
    const deposited = Math.max(0, Number(depositedAmount) || 0);
    return Math.max(0, parseFloat((required - deposited).toFixed(2)));
}

/** @deprecated Use getComboRemainingDeposit — wallet balance is not part of combo deposit math. */
export function getComboTopUpAmount(requiredDeposit: number, depositedAmount: number): number {
    return getComboRemainingDeposit(requiredDeposit, depositedAmount);
}

/** True when a combo still needs approved deposits before it can be submitted. */
export function comboNeedsDeposit(params: {
    isCombo: boolean;
    isAdminAuthorized?: boolean;
    requiredDeposit?: number | null;
    storedPrice?: number;
    depositedAmount?: number;
}): boolean {
    const { isCombo, isAdminAuthorized, requiredDeposit, storedPrice, depositedAmount } = params;
    if (!isCombo || isAdminAuthorized) return false;
    const required = getComboAdminAmount({ isCombo: true, requiredDeposit, storedPrice });
    if (required <= 1e-6) return false;
    return getComboRemainingDeposit(required, depositedAmount ?? 0) > 1e-6;
}
