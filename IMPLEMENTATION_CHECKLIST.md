# Implementation Checklist

## Feature Tracking

| # | Feature | Status | Files Changed |
|---|---------|--------|---------------|
| 1 | Block withdrawal until 25/25 orders completed | ✅ Done | `transaction.server.ts`, `dashboard/page.tsx` |
| 2 | Progressive commission per order (5-10% increase); combo = 30% | ✅ Done | `grab.server.ts` |
| 3 | Withdraw modal: wallet address + network name (Binance TRC-20) | ✅ Done | `dashboard/page.tsx`, `Transaction.ts` |
| 4 | Fix counter reset after logout/login (UTC date comparison) | ✅ Done | `grab.server.ts` |
| 5 | Dynamic records (PENDING + COMPLETED from DB); cancel button | ✅ Done | `grab/records/route.ts`, `grab/cancel/route.ts`, `GrabRecordList.tsx` |
| 6 | Combo order: block grab until deposit if balance < required | ✅ Done | `grab.server.ts` |

---

## Detail Notes

### 1 — Withdraw Blocked Until 25/25
- `transactionServerService.processTransaction()` throws if `type === "WITHDRAW"` and `dailyTasksCompleted < maxDailyTasks`
- WithdrawModal on Mine page shows a locked state with counter

### 2 — Progressive Commission
- Orders 1-25: rate grows from 1% → ~2.6% using formula `rate = 0.01 * (1.04 ^ (orderIndex - 1))`
- Floor: at least $0.50 commission per order (balance-independent)
- Combo orders: 30% of `requiredDeposit` (not of balance)

### 3 — Withdraw Modal Fields
- Network: hardcoded "Binance (TRC-20)" 
- Wallet Address: user inputs their USDT TRC-20 address
- Saved as `withdrawAddress` on the Transaction document

### 4 — UTC Date Fix
- `formatDate()` now uses `getUTCFullYear/Month/Date` to avoid timezone-triggered resets

### 5 — Dynamic Records
- `GET /api/grab/records` returns both PENDING and COMPLETED orders
- `POST /api/grab/cancel` cancels a PENDING order → status becomes CANCELLED
- Cancelled orders appear in Incomplete tab with "Cancelled" badge
- Complete tab lists real DB records (no more static fake data)
- Each incomplete order has an × cancel button

### 6 — Combo Deposit Enforcement
- In `grabNewOrder`: if combo detected and `user.balance < comboSetting.requiredDeposit`, throw with clear deposit message (don't create order yet)
