import joi from "joi";
import BaseDTO from "../../../common/dto/base.dto.js";

class RegisterDTO extends BaseDTO {
    static schema = joi.object({
        firstName: joi.string().trim().min(3).max(255).required(),
        lastName: joi.string().trim().min(3).max(255),
        email: joi.string().email().lowercase().required(),
        password: joi.string()
            .min(6)
            .max(255)
            .pattern(/(?=.*[A-Z])(?=.*\d)/)
            .message("Password must contain one uppercase letter and one digit")
            .required(),
        
    })
}

export default RegisterDTO;