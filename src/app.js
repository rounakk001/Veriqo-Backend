import express from "express"   
import cors from "cors"

import cookieParser from "cookie-parser"


const app = express();

// Enable Cross-Origin Resource Sharing (CORS)
// Allows the frontend (specified in CORS_ORIGIN) to communicate with this backend
// credentials: true enables cookies and authentication headers across origins
app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);      

// Parse incoming JSON request bodies
// Requests larger than 16 KB will be rejected
app.use(express.json({ limit: "16kb" }));

// Parse URL-encoded form data
// extended: true allows parsing of nested objects
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Serve static files (images, PDFs, uploads, etc.) from the "public" directory
app.use(express.static("public"));

// Parse cookies from incoming requests
// Makes cookies available via req.cookies
app.use(cookieParser());




//routes  import 

import authRouter from "./routes/auth.routes.js";

app.use("/api/v1/auth",authRouter)

import portfolioRouter from "./routes/portfolio.routes.js";

app.use("/api/v1/portfolio", portfolioRouter);

import searchHistoryRouter from "./routes/searchHistory.routes.js";

app.use("/api/v1/searchHistory", searchHistoryRouter);


import { errorHandler } from "./middlewares/error.middleware.js";

app.use(errorHandler);









export { app };