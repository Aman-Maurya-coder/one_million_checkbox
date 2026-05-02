import joi from "joi";

class BaseDTO {
    static schema = joi.object({});
    
    static validate(data) {
        const { error, value } = this.schema.validate(data, {
            abortEarly: false,
            stripUnknown: true
        })

        if (error) {
            const errors = error.details.map(detail => detail.message);
            return { error: errors[0], value: null};
        }
        return { error: null, value};
    }
}

export default BaseDTO;