// ApiError ek custom error class hai jo Error class ko extend karti hai.
// Iska use application me standard error responses bhejne ke liye hota hai.

class ApiError extends Error {

    constructor(
        statusCode,                        // HTTP status code (404, 401, 500, etc.)
        message = "Something went wrong",  // Default error message
        errors = [],                       // Additional validation ya custom errors
        stack = ""                         // Optional custom stack trace
    ) {

        // Parent Error class ka constructor call karte hain
        // jisse error.message set ho jata hai
        super(message)

        // HTTP status code store karte hain
        this.statusCode = statusCode

        // Error response me data nahi hoga
        this.data = null

        // Error message
        this.message = message

        // Request failed hai isliye success false
        this.success = false

        // Detailed errors array
        this.errors = errors

        // Agar custom stack pass ki gayi hai to use karo
        if (stack) {
            this.stack = stack
        }
        else {

            // Current error ka clean stack trace generate karta hai
            // Constructor call ko stack trace me include nahi karta

            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export { ApiError }



// Example Usage:

// throw new ApiError(
//     404,
//     "User not found"
// )


// Error Object:

// {
//     "statusCode": 404,
//     "data": null,
//     "message": "User not found",
//     "success": false,
//     "errors": []
// }



// Validation Error Example:

// throw new ApiError(
//     400,
//     "Validation Failed",
//     [
//         "Email is required",
//         "Password must be at least 8 characters"
//     ]
// )



// Flow:

// Controller
//     ↓
// throw new ApiError(404, "User not found")
//     ↓
// asyncHandler catches error
//     ↓
// next(error)
//     ↓
// Express Error Middleware
//     ↓
// Standard JSON Error Response



// Why use ApiError?

// 1. Har error ka same structure milta hai.
// 2. Status code easily manage hota hai.
// 3. Validation errors bhej sakte ho.
// 4. Error middleware simple ho jata hai.
// 5. Production-level error handling ke liye useful hai.