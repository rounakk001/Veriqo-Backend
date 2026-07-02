import mongoose, { Schema } from "mongoose";

const searchHistorySchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        // Stock ticker symbol (e.g. AAPL, MSFT, RELIANCE.NS)
        symbol: {
            type: String,
            required: [true, "Stock symbol is required."],
            uppercase: true,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate search entries for the same user.
searchHistorySchema.index(
    { userId: 1, symbol: 1 },
    { unique: true }
);

export const SearchHistory = mongoose.model(
    "SearchHistory",
    searchHistorySchema
);