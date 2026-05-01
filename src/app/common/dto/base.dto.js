import joi from "joi";

class BaseDTO {
    static schema = joi.object({});
    
    static validate(data) {
        const { error, value } = this.schema.validate(data, {
            aboutEarly: false,
            stripUnknown: true
        })

        if (error) {
            const errors = error.details.map(detail => detail.message);
            return { errors, value: null};
        }
        return { errors: null, value};
    }
}

export default BaseDTO;