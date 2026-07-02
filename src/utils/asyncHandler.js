// requestHandler = actual controller function
const asyncHandler = (requestHandler) => {

    // Express is returned middleware ko execute karega
    return (req, res, next) => {

        // Controller ko execute karo.
        // Agar controller Promise return kare (async function),
        // to Promise.resolve usse handle karega.

        Promise
            .resolve(requestHandler(req, res, next))

            // Agar controller ke andar koi error aati hai
            // ya Promise reject hoti hai,
            // to error next(err) ke through
            // Express Error Handling Middleware ko bhej di jayegi.

            .catch((err) => next(err))
    }
}

export { asyncHandler }