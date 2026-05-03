import jwt from "jsonwebtoken";
import "dotenv/config";
import crypto from "node:crypto";
import { PUBLIC_KEY, PRIVATE_KEY } from "./cert.js";

const generateAccessToken = (payload) => {
    return jwt.sign(payload, PRIVATE_KEY, {
        algorithm: "RS256",
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    })
}

const verifyAccessToken = (token) => {
    return jwt.verify(token, PUBLIC_KEY, { algorithms: ["RS256"] });
} 

const generateRefreshToken = (payload) => {
    return jwt.sign(payload, PRIVATE_KEY, {
        algorithm: "RS256",
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    })
}

const verifyRefreshToken = (token) => {
    return jwt.verify(token, PUBLIC_KEY, { algorithms: ["RS256"] });
}

const generateResetToken = () => {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashToken = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");
    return { rawToken, hashToken };
}

export {
    generateAccessToken,
    verifyAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    generateResetToken
}