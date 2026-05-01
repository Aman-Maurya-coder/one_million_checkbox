import ApiResponse from "../../common/utils/apiResponse.js"
import ApiError from "../../common/utils/apiError.js"
import { db } from "../../../db/index.js"
import { users } from "../../../db/schema.js"


const register = async (req, res) => {
    const user = req.body;
    console.log("Registering user:", user);
}

export { register }