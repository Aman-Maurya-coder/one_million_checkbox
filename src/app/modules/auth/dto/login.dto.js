import joi from "joi";
import BaseDTO from "../../../common/dto/base.dto.js";

class LoginDTO extends BaseDTO {
    static schema = joi.object({
        email: joi.string().email().lowercase().required(),
        password: joi.string().required()
    })
}

export default LoginDTO;