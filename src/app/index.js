import path from "node:path";
import "dotenv/config";

import express from "express";
import { Server } from "socket.io";
import authRouter from "./modules/auth/auth.routes.js";
import cookieParser from "cookie-parser";
import ApiError from "./common/utils/ApiError.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// app.use(express.static(path.join(process.cwd(), "public")));

app.use("/api/auth", authRouter);

app.get("/health", (req, res) => {
    res.json({ healthy: true });
});

// app.all("{*path}", (req, res) => {
//     throw ApiError.notFound(`Route ${req.originalUrl} not found`);
// })

export default app;