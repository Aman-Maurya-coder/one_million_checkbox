import ApiError from "../../common/utils/apiError.js";
import { verifyAccessToken } from "../../common/utils/jwt.utils.js";
import { db } from "../../../db/index.js";
import { users } from "../../../db/schema.js";
import { eq } from "drizzle-orm";


const authenticate = async (req, res, next) => {
    let token;

    if (req.headers?.authorization && req.headers.authorization?.startsWith("Bearer ")){
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