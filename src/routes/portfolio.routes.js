import { Router } from "express";

import {
    addHolding,
    getPortfolio,
    updateHolding,
    removeHolding,
} from "../controllers/portfolio.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All portfolio routes require authentication.
router.use(verifyJWT);

// Create a new holding.
router.route("/").post(addHolding);

// Fetch portfolio.
router.route("/").get(getPortfolio);

// Update an existing holding.
router.route("/:holdingId").patch(updateHolding);

// Delete a holding.
router.route("/:holdingId").delete(removeHolding);

export default router;