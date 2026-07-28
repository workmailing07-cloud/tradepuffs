import mongoose, { Document, Model, Schema } from "mongoose";

export interface ISupportConfig extends Document {
    singletonKey: string;
    telegramUsername: string;
    createdAt: Date;
    updatedAt: Date;
}

const SupportConfigSchema = new Schema<ISupportConfig>(
    {
        singletonKey: { type: String, required: true, unique: true, default: "default" },
        telegramUsername: { type: String, default: "" },
    },
    { timestamps: true }
);

const SupportConfig: Model<ISupportConfig> =
    mongoose.models.SupportConfig || mongoose.model<ISupportConfig>("SupportConfig", SupportConfigSchema);

export default SupportConfig;
