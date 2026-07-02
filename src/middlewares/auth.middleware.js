import jwt from "jsonwebtoken";

import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Verifies the JWT access token and attaches the authenticated user to the request.
export const verifyJWT = asyncHandler(async (req, res, next) => {

    // Access token can come either from HttpOnly cookies
    // or from the Authorization header (for mobile/third-party clients).
    const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "").trim();

    if (!token) {
        throw new ApiError(401, "Unauthorized request.");
    }

    // Verify and decode the JWT payload.
    const decodedToken = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken._id).select(
        "-password -refreshToken"
    );

    if (!user) {
        throw new ApiError(401, "Invalid access token.");
    }

    // Make the authenticated user available to downstream controllers.
    req.user = user;

    next();
});