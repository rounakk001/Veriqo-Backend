import { SearchHistory } from "../models/searchHistory.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


                /* save search */       


// Saves a company search for the authenticated user.
export const saveSearch = asyncHandler(async (req, res) => {

    const { symbol } = req.body;

    if (!symbol || symbol.trim() === "") {
        throw new ApiError(400, "Stock symbol is required.");
    }

    const normalizedSymbol = symbol.trim().toUpperCase();

    // Prevent duplicate entries by updating the timestamp instead.
    const existingSearch = await SearchHistory.findOne({
        userId: req.user._id,
        symbol: normalizedSymbol,
    });

    if (existingSearch) {
        await SearchHistory.findByIdAndUpdate(
            existingSearch._id,
            {
                $set: {
                    updatedAt: new Date(),
                },
            }
        );

        return res.status(200).json(
            new ApiResponse(
                200,
                existingSearch,
                "Search history updated successfully."
            )
        );
    }

    try {
        const search = await SearchHistory.create({
            userId: req.user._id,
            symbol: normalizedSymbol,
        });

        // Enforce maximum of 10 recent searches per user
        const searches = await SearchHistory.find({ userId: req.user._id })
            .sort({ updatedAt: -1 });
        
        if (searches.length > 10) {
            const searchesToDelete = searches.slice(10).map(s => s._id);
            await SearchHistory.deleteMany({ _id: { $in: searchesToDelete } });
        }

        return res.status(201).json(
            new ApiResponse(
                201,
                search,
                "Search saved successfully."
            )
        );

    } catch (error) {

        if (error.code === 11000) {
            throw new ApiError(409, "Search already exists.");
        }

        throw error;
    }
});



// Returns the authenticated user's recent searches.
export const getSearchHistory = asyncHandler(async (req, res) => {

    const searches = await SearchHistory
        .find({ userId: req.user._id })
        .sort({ updatedAt: -1 })
        .limit(20);

    return res.status(200).json(
        new ApiResponse(
            200,
            searches,
            "Search history fetched successfully."
        )
    );
});



// Removes a single search entry.
export const deleteSearch = asyncHandler(async (req, res) => {

    const { searchId } = req.params;

    const deletedSearch = await SearchHistory.findOneAndDelete({
        _id: searchId,
        userId: req.user._id,
    });

    if (!deletedSearch) {
        throw new ApiError(404, "Search history not found.");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Search removed successfully."
        )
    );
});



// Removes all search history for the authenticated user.
export const clearSearchHistory = asyncHandler(async (req, res) => {

    await SearchHistory.deleteMany({
        userId: req.user._id,
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Search history cleared successfully."
        )
    );
});