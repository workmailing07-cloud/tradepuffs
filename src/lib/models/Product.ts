import { Schema, model, models } from "mongoose";

const ProductSchema = new Schema({
    name: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now },
});

const Product = models.Product || model("Product", ProductSchema);
export default Product;
