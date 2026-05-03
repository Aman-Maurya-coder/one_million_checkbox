import ApiResponse from "../../common/utils/apiResponse.js"
import ApiError from "../../common/utils/apiError.js"
import { db } from "../../../db/index.js"
import { users } from "../../../db/schema.js"
import * as authService from "./auth.service.js"
import jose from "node-jose";
import path from "node:path"
import { PUBLIC_KEY } from "../../common/utils/cert.js";

const openIdConfiguration = (req, res) => {
    const ISSUER = `http://localhost:${process.env.PORT || 8000}`;
    return res.json({
        issuer: ISSUER,
        authorization_endpoint: `${ISSUER}/api/auth/`,
        userinfo_endpoint: `${ISSUER}/api/auth/userinfo`,
        jwks_uri: `${ISSUER}/.well-known/jwks.json`,
    })
}

const jwks = async (req, res) => {
    const key = await jose.JWK.asKey(PUBLIC_KEY, "pem");
    return res.json({ keys: [key.toJSON()] });
}

const authenticationPage = (req, res) => {
    res.sendFile(path.resolve("public", "authenticate.html"))
}

const register = async (req, res) => {
    const user = await authService.register(req.body);
    ApiResponse.created(
        res,
        "user registered successfully", 
        { user }
    );
}

const login = async (req, res) => {
    const { user, accessToken, refreshToken  } = await authService.login(req.body);
    
    res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    ApiResponse.ok(
        res,
        "user logged in successfully",
        { user, accessToken }
    );
}

const refreshToken = async (req, res) => {
    const token = req.cookies?.refreshToken;
    const { accessToken } = await authService.refresh(token);
    ApiResponse.ok(
        res,
        "Access token refreshed successfully",
        { accessToken }
    );
}

const userInfo = async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
    res
        .status(401)
        .json({ message: "Missing or invalid Authorization header." });
    return;
    }

    const token = authHeader.slice(7);
    const userInfo = await authService.userInfo(token);
    ApiResponse.ok(res, "User info retrieved successfully", { user: userInfo });
}

const logout = async (req, res) => {
    await authService.logout(req.user.id);
    res.clearCookie("refreshToken");
    ApiResponse.ok(res, "Logged out successfully");
}

export { openIdConfiguration, jwks, authenticationPage, register, login, refreshToken, userInfo, logout }