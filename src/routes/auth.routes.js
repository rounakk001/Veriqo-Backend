import { Router } from "express";

import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    googleLogin,
    googleCallback,
    deleteAccount,
    updateProfile,
    changePassword,
} from "../controllers/auth.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

//public routes

// Register a new user
router.route("/register").post(registerUser);

// Login using email and password
router.route("/login").post(loginUser);

// Redirect browser to Google consent screen
router.route("/google").get(googleLogin);

// Google redirects back here after consent
router.route("/google/callback").get(googleCallback);

// Generate a new access token using a valid refresh token
router.route("/refresh-token").post(refreshAccessToken);



/*                              Protected Routes                              */


// Logout the authenticated user
router.route("/logout").post(verifyJWT, logoutUser);

// Returns the currently authenticated user
router.route("/me").get(verifyJWT, getCurrentUser);

// Update user profile
router.route("/profile").patch(verifyJWT, updateProfile);

// Change user password
router.route("/password").patch(verifyJWT, changePassword);

// Delete the authenticated user's account
router.route("/account").delete(verifyJWT, deleteAccount);

export default router;