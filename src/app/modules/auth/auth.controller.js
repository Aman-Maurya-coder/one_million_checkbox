import ApiResponse from "../../common/utils/apiResponse.js"
import ApiError from "../../common/utils/apiError.js"
import { db } from "../../../db/index.js"
import { users } from "../../../db/schema.js"
import * as authService from "./auth.service.js"


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

const logout = async (req, res) => {
    await authService.logout(req.user.id);
    res.clearCookie("refreshToken");
    ApiResponse.ok(res, "Logged out successfully");
}

export { register, login, refreshToken }