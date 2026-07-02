import mongoose, { Schema } from "mongoose";

const holdingSchema = new Schema(
    {
        // Stock ticker symbol (e.g. AAPL, MSFT, RELIANCE.NS)
        symbol: {
            type: String,
            required: [true, "Stock symbol is required."],
            uppercase: true,
            trim: true,
        },

        // Number of shares owned.
        shares: {
            type: Number,
            required: [true, "Number of shares is required."],
            min: [1, "Shares must be at least 1."],
        },
        

        // Date when the position was first created.
        purchaseDate: {
            type: Date,
            default: Date.now,
        },

        // Last time this holding was modified.
        updatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        _id: true,
    }
);

const portfolioSchema = new Schema(
    {
        // Owner of the portfolio.
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },

        // Collection of all holdings.
        holdings: {
            type: [holdingSchema],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

export const Portfolio = mongoose.model("Portfolio", portfolioSchema);