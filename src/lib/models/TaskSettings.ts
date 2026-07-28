import mongoose, { Document, Model, Schema } from "mongoose";

export interface ITaskSettings extends Document {
    singletonKey: string;
    requestCooldownMinutes: number;
    createdAt: Date;
    updatedAt: Date;
}

const TaskSettingsSchema = new Schema<ITaskSettings>(
    {
        singletonKey: { type: String, required: true, unique: true, default: "default" },
        requestCooldownMinutes: { type: Number, default: 20, min: 0 },
    },
    { timestamps: true }
);

const TaskSettings: Model<ITaskSettings> =
    mongoose.models.TaskSettings || mongoose.model<ITaskSettings>("TaskSettings", TaskSettingsSchema);

export default TaskSettings;
