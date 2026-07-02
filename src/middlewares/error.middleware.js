import { ApiError } from "../utils/ApiError.js";

// Global error handler.
// Any error passed using next(error) will be processed here.
const errorHandler = (err, req, res, next) => {

    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: err.success,
            message: err.message,
            errors: err.errors,
            data: err.data,
        });
    }

    console.error(err);

    return res.status(500).json({
        success: false,
        message: "Internal Server Error.",
        errors: [],
        data: null,
    });
};

export { errorHandler };