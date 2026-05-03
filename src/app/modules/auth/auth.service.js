import { db } from "../../../db/index.js"
import { users } from "../../../db/schema.js"
import ApiError from "../../common/utils/apiError.js"
import { eq } from 'drizzle-orm/sql/expressions/conditions';

import {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken, 
    generateResetToken
} from "../../common/utils/jwt.utils.js";
import { createHmac, randomBytes } from "crypto";

const register = async ({ firstName, lastName, email, password }) => {
    // Implementation for user registration
    const [isUserAlreadyExist] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
    if (isUserAlreadyExist) {
        throw ApiError.conflict("User with this email already exists");
    }
    // const { rawToken, hashToken } = generateResetToken();
    const salt = randomBytes(32).toString("hex")
    const hash = createHmac('sha256', salt).update(password).digest('hex');
    const result = await db.insert(users).values({
        firstName,
        lastName,
        email,
        password: hash,
        salt
    }).returning({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email });
    return result[0];
}

const login = async ({ email, password}) => {
    const [user] = await db
    .select({ email: users.email, password: users.password, salt: users.salt })
    .from(users)
    .where(eq(users.email, email));
    
    if (!user) {
        console.log(user);
        throw ApiError.unauthorized(`Invalid email or password: ${email}`);
    }

    const salt = user.salt;
    const inputPasswordHash = createHmac("sha256", salt).update(password).digest("hex");
    
    if (inputPasswordHash !== user.password) {
        throw ApiError.unauthorized("Invalid password");
    }
    
    const accessToken = generateAccessToken({ email: user.email });
    const refreshToken = generateRefreshToken({ email: user.email });
    const hashedRefreshToken = createHmac("sha256", salt).update(refreshToken).digest("hex");
    
    await db.update(users).set({ refreshToken: hashedRefreshToken }).where(eq(users.email, email));
    
    return { user: { email: user.email }, accessToken, refreshToken };
}

const refresh = async (token) => {
    if (!token) throw ApiError.unauthorized("Refresh Token Misssing!");

    const decoded = verifyRefreshToken(token);

    const [user] = await db.select({
        email: users.email, 
        refreshToken: users.refreshToken,
    })
    .from(users)
    .where(eq(users.email, decoded.email));

    if (!user || !user.refreshToken) {
        throw ApiError.unauthorized("Invalid Refresh Token - please login again");
    }

    const newAccessToken = generateAccessToken({ email: user.email });

    return { accessToken: newAccessToken };
};

const userInfo = async (token) => {
    if (!token) throw ApiError.unauthorized("Access Token Misssing!");

    const decoded = verifyAccessToken(token);
    if (!decoded.email) {
        throw ApiError.unauthorized("Invalid Access Token - please login again");
    }
    const [user] = db.select().from(users).where(eq(users.email, decoded.email)).limit(1);
    if (!user) {
        throw ApiError.unauthorized("User not found - please login again");
    }
    return { email: user.email, firstName: user.firstName, lastName: user.lastName };
}

const logout = async (id) => {
    try {
        await db.update(users).set({ refreshToken: null}).where(eq(users.id, id));
    } catch (error) { 
        throw ApiError.internal("Failed to logout user");
    }
}

export { register, login, refresh, logout }