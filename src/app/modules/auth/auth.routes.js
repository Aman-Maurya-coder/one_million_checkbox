import express from "express";

import validate from "../../common/middleware/validate.middleware.js";
import RegisterDTO from "./dto/register.dto.js";
import { register } from "./auth.controller.js";

const authRouter = express.Router();

authRouter.post("/register", validate(RegisterDTO), register);

export default authRouter;

