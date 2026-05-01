class ApiError extends Error {
    constructor(statusCode, message){
        super(message);
        this.statusCode = statusCode;

        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(message = "Bad request") {
        return new ApiError(400, message);
    }

    static notFound(message = "Not found") {
        return new ApiError(404, message);
    }

}

export default ApiError;