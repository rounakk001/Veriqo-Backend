import { Router } from "express";

import {
    saveSearch,
    getSearchHistory,
    deleteSearch,
    clearSearchHistory,
} from "../controllers/searchHistory.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All search history routes require authentication
router.use(verifyJWT);

// Create or update a search entry
router.route("/").post(saveSearch);

// Fetch recent search history
router.route("/").get(getSearchHistory);

// Remove all search history
router.route("/").delete(clearSearchHistory);

// Remove a specific search entry by ID
router.route("/:searchId").delete(deleteSearch);

export default router;
