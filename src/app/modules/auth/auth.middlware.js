import ApiError from "../../common/utils/apiError";
import { verifyAccessToken } from "../../common/utils/jwt.utils";
import { db } from "../../../db"; 
import { users } from "../../../db/schema.js";


const authenticate = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.statswith("Bearer")){
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        throw ApiError.unauthorized("Access token missing");
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) throw ApiError.unauthorized("Invalid access token");

    const [user] = await db.select().from(users).where(eq(users.email, decoded.email));
    if (!user ) throw ApiError.unauthorized("User not found");

    req.user = {
        id: user.id,
        email: user.email
    }
    next();
}

export default authenticate;