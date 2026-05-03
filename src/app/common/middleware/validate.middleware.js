import ApiError from "../utils/apiError.js";

const validate = (DtoClass) => {
    return (req, res, next) => {
        const { error, value } = DtoClass.validate(req.body);

        if (error) {
            return next(ApiError.badRequest(`Validation error: ${error}`));
        }
        req.body = value;
        next();
    }
}

export default validate;