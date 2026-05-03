import express from "express";

import validate from "../../common/middleware/validate.middleware.js";
import RegisterDTO from "./dto/register.dto.js";
import LoginDTO from "./dto/login.dto.js";
import * as controller from "./auth.controller.js";
import authenticate from "./auth.middleware.js";

const authRouter = express.Router();

authRouter.get("/", controller.authenticationPage);
authRouter.post("/register", validate(RegisterDTO), controller.register);
authRouter.post("/login", validate(LoginDTO), controller.login);
authRouter.post("/refresh-token", controller.refreshToken);
authRouter.post("/logout", authenticate, controller.logout);

export default authRouter;

