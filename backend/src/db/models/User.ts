import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
        },
        passwordHash: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

export type UserDocument = mongoose.InferSchemaType<typeof userSchema>;

export const User =
    mongoose.models.User ?? mongoose.model("User", userSchema);
