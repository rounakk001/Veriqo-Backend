import { Portfolio } from "../models/portfolio.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Adds a new holding to the authenticated user's portfolio.
// If the holding already exists, the number of shares is increased.
export const addHolding = asyncHandler(async (req, res) => {

    const { symbol, shares } = req.body;

    if (!symbol || symbol.trim() === "") {
        throw new ApiError(400, "Stock symbol is required.");
    }

    if (!shares || shares <= 0) {
        throw new ApiError(400, "Shares must be greater than zero.");
    }

    let portfolio = await Portfolio.findOne({
        userId: req.user._id,
    });

    // Create a portfolio if this is the user's first holding.
    if (!portfolio) {
        portfolio = await Portfolio.create({
            userId: req.user._id,
            holdings: [],
        });
    }

    const normalizedSymbol = symbol.trim().toUpperCase();

    // Check whether the holding already exists.
    const existingHolding = portfolio.holdings.find(
        (holding) => holding.symbol === normalizedSymbol
    );

    if (existingHolding) {
        existingHolding.shares += Number(shares);
    } else {
        portfolio.holdings.push({
            symbol: normalizedSymbol,
            shares: Number(shares),
        });
    }

    await portfolio.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            portfolio,
            "Holding added successfully."
        )
    );
});

// Returns the authenticated user's portfolio.
export const getPortfolio = asyncHandler(async (req, res) => {

    const portfolio = await Portfolio.findOne({
        userId: req.user._id,
    });

    // Return an empty portfolio if the user has not added any holdings yet.
    if (!portfolio) {
        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    holdings: [],
                },
                "Portfolio is empty."
            )
        );
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            portfolio,
            "Portfolio fetched successfully."
        )
    );
});


// Updates the number of shares for an existing holding.
export const updateHolding = asyncHandler(async (req, res) => {

    const { holdingId } = req.params;
    const { shares } = req.body;

    if (!shares || shares <= 0) {
        throw new ApiError(400, "Shares must be greater than zero.");
    }

    const portfolio = await Portfolio.findOne({
        userId: req.user._id,
    });

    if (!portfolio) {
        throw new ApiError(404, "Portfolio not found.");
    }

    const holding = portfolio.holdings.id(holdingId);

    if (!holding) {
        throw new ApiError(404, "Holding not found.");
    }

    holding.shares = Number(shares);

    await portfolio.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            portfolio,
            "Holding updated successfully."
        )
    );
});

// Removes a holding from the authenticated user's portfolio.
export const removeHolding = asyncHandler(async (req, res) => {

    const { holdingId } = req.params;

    const portfolio = await Portfolio.findOne({
        userId: req.user._id,
    });

    if (!portfolio) {
        throw new ApiError(404, "Portfolio not found.");
    }

    const holding = portfolio.holdings.id(holdingId);

    if (!holding) {
        throw new ApiError(404, "Holding not found.");
    }

    holding.deleteOne();

    await portfolio.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            portfolio,
            "Holding removed successfully."
        )
    );
});