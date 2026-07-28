# 🎢 Grab System & Task Flow Documentation

This document outlines the logic and technical flow of the order grabbing system, including daily task limits, earnings tracking, and the "Exclusive Combo" mechanism.

---

## 🏗️ Core Architecture

### 1. User State & Migration
To ensure backward compatibility for old accounts and instant setup for new accounts, every request to `/api/user/me` performs an **Auto-Migration**:
- **Missing Fields**: If a user lacks `dailyTasksCompleted`, `dailyCommission`, or `maxDailyTasks`, the server initializes them with defaults (`0, 0, 25`).
- **Atomic Persistence**: These values are immediately saved to MongoDB to prevent "NaN" errors or state loss during UI updates.

### 2. Daily Reset Logic
The system automatically refreshes a user's progress at the start of a new calendar day:
- **Trigger**: When a user clicks "START" to grab a new order.
- **Verification**: The server compares `new Date().toDateString()` against the user's `lastGrabDate`.
- **Reset**: If the dates don't match, `dailyTasksCompleted` and `dailyCommission` are set back to 0.

---

## 🎡 The Grab Lifecycle

### Step 1: Initiation (Optimistic)
- **Frontend**: The spinner starts spinning **instantly** (Optimistic Start) for high-end UX.
- **Backend**: The `/api/grab` endpoint is called.
- **Validation**: 
  - Checks if the user reached their daily limit (e.g., 25/25).
  - Checks if the user is already stuck on a pending "Exclusive Combo."
  - Generates a new order (price ~80% of balance, commission ~0.8%).

### Step 2: Transaction Processing
- **Spin Physics**: The wheel uses a custom `cubic-bezier` curve to decelerate realistically over 5 seconds.
- **Selection**: Once the API returns the product, the spinner "lands" on the matching icon via random rotation offsets.
- **Order Modal**: Displays the Grabbed Order, "Value," and "Commission."

### Step 3: Completion (Atomic)
- **Execution**: User clicks "PROCESS TRANSACTION."
- **Atomic Update**: The server uses MongoDB's `$inc` (Increment) operator to update:
  - `balance` += commission
  - `totalCommission` += commission
  - `dailyCommission` += commission
  - `dailyTasksCompleted` += 1
- **Cache Invalidation**: React Query forces the frontend to refetch `/api/user/me`, instantly updating the "0/25" and "$0.00" stats.

---

## 💎 Exclusive Combo Mechanism ("The Block")

The system has a built-in "Combo" odds (approximately 15%) designed to engage the user with a priority event.

1. **The Hit**: An order is generated where the price is **250% of the user's balance** (making it impossible to fulfill with current funds).
2. **The Status Change**: User's account status becomes `PENDING_COMBO`. They cannot grab new orders until this is resolved.
3. **The Request**: User clicks **"REQUEST INSTANT UNLOCK"**, which creates a [CSRequest](file:///e:/MERN%20Stack/nextjs-fintech/src/lib/services/admin.service.ts#14-18) for the Admin.
4. **The Admin Action**: 
   - Admin sees the request in their dashboard.
   - Admin clicks **"Resolve"**.
   - **Internal Trigger**: The specific order is marked `isAdminAuthorized: true`.
5. **The Bypass**: User returns to the modal, clicks "Submit Combo Order Anyway."
   - The server sees `isAdminAuthorized: true`.
   - The balance check is **skipped**.
   - User gets the massive commission even with $0 balance.

---

## 🛠️ Tech Stack Integration
- **Backend API**: Next.js App Router (Node/Mongoose).
- **Frontend State**: TanStack Query (React Query) for real-time synchronization.
- **Visuals**: Tailwind CSS, Lucide Icons, and Framer-motion-style CSS transitions.
- **Communications**: `sonner` for high-end toast notifications.
