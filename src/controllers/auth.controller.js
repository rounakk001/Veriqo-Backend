import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);

        if (!user) {
            throw new ApiError(404, "User not found.");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };

    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating access and refresh tokens."
        );
    }
};

// ---------------------------- Register ----------------------------

export const registerUser = asyncHandler(async (req, res) => {

    const { fullname, email, password } = req.body;

    if (
        [fullname, email, password].some(
            (field) => !field || field.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required.");
    }

    const existedUser = await User.findOne({ email });

    if (existedUser) {
        throw new ApiError(409, "User with this email already exists.");
    }

    const user = await User.create({
        fullname,
        email,
        password,
    });

    const { accessToken, refreshToken } =
        await generateAccessAndRefreshTokens(user._id);

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(
            500,
            "Something went wrong while registering the user."
        );
    }

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    };

    return res
        .status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                201,
                {
                    user: createdUser,
                    accessToken,
                    refreshToken,
                },
                "User registered successfully."
            )
        );
});

// ---------------------------- Login ----------------------------

export const loginUser = asyncHandler(async (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required.");
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
        throw new ApiError(404, "User does not exist.");
    }

    // If the account was created with Google and never set a local password, block local login
    if (!user.password) {
        throw new ApiError(
            400,
            "This account was created with Google Sign-In. Please continue with Google."
        );
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials.");
    }

    const { accessToken, refreshToken } =
        await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                "User logged in successfully.",
                
            )
        );
});

// ---------------------------- Logout ----------------------------

export const logoutUser = asyncHandler(async (req, res) => {

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1,
            },
        },
        {
            new: true,
        }
    );

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(
                200,
                {},
                "User logged out successfully."
            )
        );
});




// Refreshes the access token using a valid refresh token.
export const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken =
        req.cookies?.refreshToken ||
        req.body?.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request.");
    }

    try {

        // Verify the refresh token.
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token.");
        }

        // Ensure the refresh token matches the one stored in the database.
        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or already used.");
        }

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
        };

        const {
            accessToken,
            refreshToken: newRefreshToken,
        } = await generateAccessAndRefreshTokens(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken: newRefreshToken,
                    },
                    "Access token refreshed successfully."
                )
            );

    } catch (error) {
        throw new ApiError(
            401,
            error?.message || "Invalid refresh token."
        );
    }
});


// Returns the currently authenticated user.
export const getCurrentUser = asyncHandler(async (req, res) => {

    return res.status(200).json(
        new ApiResponse(
            200,
            req.user,
            "Current user fetched successfully."
        )
    );

});


const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL
);

// Validates that the redirect URL is a relative path to prevent open redirects
const getValidatedRedirectUrl = (redirectParam) => {
    if (typeof redirectParam === "string" && redirectParam.startsWith("/") && !redirectParam.startsWith("//")) {
        return redirectParam;
    }
    return "/";
};

// Handles Google authentication redirect.
export const googleLogin = asyncHandler(async (req, res) => {
    const redirectUrl = getValidatedRedirectUrl(req.query.redirect);

    const authorizeUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: [
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email"
        ],
        prompt: "consent",
        state: redirectUrl, // Pass the redirect URL via state
    });

    res.redirect(authorizeUrl);
});

// Handles Google OAuth callback.
export const googleCallback = asyncHandler(async (req, res) => {
    const { code, state } = req.query;
    const redirectUrl = getValidatedRedirectUrl(state);
    const FRONTEND_URL = process.env.CORS_ORIGIN || "http://localhost:3000";

    if (!code) {
        return res.redirect(`${FRONTEND_URL}/login?error=GoogleAuthFailed&redirect=${encodeURIComponent(redirectUrl)}`);
    }

    try {
        const { tokens } = await oauth2Client.getToken(code);
        
        const ticket = await oauth2Client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        
        if (!payload || !payload.email) {
            throw new Error("No email returned from Google");
        }

        let user = await User.findOne({ email: payload.email }).select("+password");

        if (!user) {
            // Create a new user if they don't exist
            user = await User.create({
                fullname: payload.name || "Google User",
                email: payload.email,
                authProvider: "google",
                googleId: payload.sub,
                // Note: password is not required for authProvider="google" in the model
            });
        } else {
            // Link Google account to existing user without destroying local password
            if (user.authProvider !== "google" || user.googleId !== payload.sub) {
                user.authProvider = "google"; // Allow both auth methods to coexist in our logic
                user.googleId = payload.sub;
                await user.save({ validateBeforeSave: false });
            }
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
        };

        res.cookie("accessToken", accessToken, options)
           .cookie("refreshToken", refreshToken, options);

        // Redirect back to the trusted frontend destination
        res.redirect(`${FRONTEND_URL}${redirectUrl}`);

    } catch (error) {
        console.error("Google Auth Error:", error);
        res.redirect(`${FRONTEND_URL}/login?error=GoogleAuthFailed&redirect=${encodeURIComponent(redirectUrl)}`);
    }
});


// ---------------------------- Delete Account ----------------------------

import { Portfolio } from "../models/portfolio.model.js";
import { SearchHistory } from "../models/searchHistory.model.js";

export const deleteAccount = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Delete all related data atomically
    await Promise.all([
        Portfolio.deleteMany({ userId }),
        SearchHistory.deleteMany({ userId }),
        User.findByIdAndDelete(userId),
    ]);

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "Account deleted successfully."));
});


// ---------------------------- Update Profile ----------------------------

export const updateProfile = asyncHandler(async (req, res) => {
    const { fullname } = req.body;

    if (!fullname || fullname.trim() === "") {
        throw new ApiError(400, "Full name is required.");
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { fullname: fullname.trim() } },
        { new: true, runValidators: true }
    ).select("-password -refreshToken");

    if (!updatedUser) {
        throw new ApiError(404, "User not found.");
    }

    return res.status(200).json(
        new ApiResponse(200, updatedUser, "Profile updated successfully.")
    );
});


// ---------------------------- Change Password ----------------------------

export const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        throw new ApiError(400, "Current password and new password are required.");
    }

    if (newPassword.length < 8) {
        throw new ApiError(400, "New password must be at least 8 characters.");
    }

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
        throw new ApiError(404, "User not found.");
    }

    if (!user.password) {
        throw new ApiError(400, "Password change is not available for Google accounts.");
    }

    const isPasswordValid = await user.isPasswordCorrect(currentPassword);
    if (!isPasswordValid) {
        throw new ApiError(401, "Current password is incorrect.");
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json(
        new ApiResponse(200, {}, "Password changed successfully.")
    );
});