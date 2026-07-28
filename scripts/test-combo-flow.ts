/**
 * End-to-end combo order test:
 * 1. Ensures a super admin account exists
 * 2. Sets up a test client with admin-configured combo deposit
 * 3. Grabs a combo order and verifies the stored/display amount matches admin value
 *
 * Run: npx tsx scripts/test-combo-flow.ts
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const ROOT = resolve(import.meta.dirname, "..");

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

const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    plainPassword: String,
    balance: { type: Number, default: 0 },
    role: { type: String, enum: ["USER", "ADMIN"], default: "USER" },
    dailyTasksCompleted: { type: Number, default: 0 },
    maxDailyTasks: { type: Number, default: 25 },
    status: { type: String, default: "ACTIVE" },
    taskRequestStatus: { type: String, default: "NONE" },
    comboConfig: [{ grabIndex: Number, requiredDeposit: Number }],
    invitationCode: String,
});

const GrabOrderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    productName: String,
    items: [{ name: String, image: String, price: Number, quantity: Number }],
    price: Number,
    commission: Number,
    status: { type: String, default: "PENDING" },
    isCombo: Boolean,
    requiredDeposit: Number,
});

const ProductSchema = new mongoose.Schema({
    name: String,
    image: String,
    isActive: { type: Boolean, default: true },
});

const ADMIN_EMAIL = "combo-test-admin@thetrade.com";
const ADMIN_PASSWORD = "ComboAdmin123!";
const CLIENT_EMAIL = "combo-test-client@thetrade.com";
const CLIENT_PASSWORD = "ComboClient123!";
const ADMIN_COMBO_VALUE = 750;

async function main() {
    loadEnv();
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI missing");

    await mongoose.connect(uri);
    const User = mongoose.models.TestUser || mongoose.model("TestUser", UserSchema, "users");
    const GrabOrder = mongoose.models.TestGrabOrder || mongoose.model("TestGrabOrder", GrabOrderSchema, "graborders");
    const Product = mongoose.models.TestProduct || mongoose.model("TestProduct", ProductSchema, "products");

    let product = await Product.findOne({ isActive: true });
    if (!product) {
        product = await Product.create({
            name: "Test Product",
            image: "https://placehold.co/100x100",
            isActive: true,
        });
        console.log("Created test product");
    }

    let admin = await User.findOne({ email: ADMIN_EMAIL });
    if (!admin) {
        const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12);
        admin = await User.create({
            name: "Combo Test Admin",
            email: ADMIN_EMAIL,
            password: hashed,
            plainPassword: ADMIN_PASSWORD,
            role: "ADMIN",
            balance: 0,
            invitationCode: "COMBOADM1",
        });
        console.log(`Created admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    } else {
        console.log(`Admin exists: ${ADMIN_EMAIL}`);
    }

    let client = await User.findOne({ email: CLIENT_EMAIL });
    if (!client) {
        const hashed = await bcrypt.hash(CLIENT_PASSWORD, 12);
        client = await User.create({
            name: "Combo Test Client",
            email: CLIENT_EMAIL,
            password: hashed,
            plainPassword: CLIENT_PASSWORD,
            role: "USER",
            balance: 120,
            invitationCode: "COMBOCLI1",
        });
        console.log(`Created client: ${CLIENT_EMAIL} / ${CLIENT_PASSWORD}`);
    }

    await GrabOrder.deleteMany({ userId: client._id, status: "PENDING" });
    client.balance = 120;
    client.dailyTasksCompleted = 0;
    client.dailyCommission = 0;
    client.status = "ACTIVE";
    client.taskRequestStatus = "APPROVED";
    client.comboConfig = [{ grabIndex: 1, requiredDeposit: ADMIN_COMBO_VALUE }];
    await client.save();
    console.log(`Configured client combo: grab #1 => $${ADMIN_COMBO_VALUE}`);

    const { grabServerService } = await import("../src/lib/services/server/grab.server");
    const result = await grabServerService.grabNewOrder(client._id.toString());
    const order = result.order;

    const price = Number(order.price);
    const requiredDeposit = Number(order.requiredDeposit);
    const itemPrice = Number(order.items?.[0]?.price);

    console.log("\n--- Grab result ---");
    console.log(`isCombo: ${order.isCombo}`);
    console.log(`price: ${price}`);
    console.log(`requiredDeposit: ${requiredDeposit}`);
    console.log(`first item price: ${itemPrice}`);
    console.log(`commission: ${Number(order.commission).toFixed(2)}`);

    const ok =
        order.isCombo === true &&
        price === ADMIN_COMBO_VALUE &&
        requiredDeposit === ADMIN_COMBO_VALUE &&
        itemPrice === ADMIN_COMBO_VALUE;

    if (!ok) {
        console.error("\nFAILED: combo order amount does not match admin configuration");
        process.exit(1);
    }

    console.log("\nPASSED: client combo order shows exact admin value ($750)");
    console.log("\nLogin credentials for manual UI check:");
    console.log(`  Admin:  ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    console.log(`  Client: ${CLIENT_EMAIL} / ${CLIENT_PASSWORD}`);
    await mongoose.disconnect();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
