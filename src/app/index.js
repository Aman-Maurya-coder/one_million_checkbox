import path from "node:path";
import "dotenv/config";

import express from "express";
import authRouter from "./modules/auth/auth.routes.js";
import cookieParser from "cookie-parser";
import { openIdConfiguration, jwks } from "./modules/auth/auth.controller.js";
import { redis } from "../../redis-connection.js";
import authenticate from "./modules/auth/auth.middleware.js";


const CHECKBOX_COUNT = Math.max(
    1,
    Number.parseInt(process.env.CHECKBOX_COUNT ?? "2000", 10) || 2000
);
const CHECKBOX_STATE_KEY = process.env.CHECKBOX_STATE_KEY || "checkbox_state";

const normalizeCheckboxState = (value) => {
    const checkboxes = Array.isArray(value) ? value : [];
    if (checkboxes.length > CHECKBOX_COUNT) {
        checkboxes.length = CHECKBOX_COUNT;
    }
    while (checkboxes.length < CHECKBOX_COUNT) {
        checkboxes.push(false);
    }
    return checkboxes;
};

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(process.cwd(), "public")));

app.get("/login", (req, res) => {
    res.sendFile(path.resolve("public", "authenticate.html"));
});

app.use("/api/auth", authRouter);
app.get("/.well-known/openid-configuration", openIdConfiguration);
app.get("/.well-known/jwks.json", jwks);

app.get("/health", (req, res) => {
    res.json({ healthy: true });
});

app.get("/checkboxes", async (req, res, next) => {
    try {
        const existingState = await redis.get(CHECKBOX_STATE_KEY);
        if (existingState) {
            const parsed = JSON.parse(existingState);
            const normalized = normalizeCheckboxState(parsed);

            if (Array.isArray(parsed) && parsed.length !== normalized.length) {
                await redis.set(CHECKBOX_STATE_KEY, JSON.stringify(normalized));
            }

            return res.json({ checkboxes: normalized });
        }
        const initial = new Array(CHECKBOX_COUNT).fill(false);
        await redis.set(CHECKBOX_STATE_KEY, JSON.stringify(initial));
        return res.json({ checkboxes: initial });
    } catch (error) {
        return res.json({ checkboxes: new Array(CHECKBOX_COUNT).fill(false) });
    }
});

app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    const statusCode = err?.statusCode || 500;
    const message = err?.message || "Internal server error";
    return res.status(statusCode).json({ success: false, message });
});

// app.all("{*path}", (req, res) => {
//     throw ApiError.notFound(`Route ${req.originalUrl} not found`);
// })

export default app;