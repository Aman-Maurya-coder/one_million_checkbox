import { verifyAccessToken } from "../../common/utils/jwt.utils.js";
import { db } from "../../../db/index.js";
import { users } from "../../../db/schema.js";
import { eq } from "drizzle-orm";

const extractBearerToken = (authorizationHeader) => {
    if (!authorizationHeader || typeof authorizationHeader !== "string") return null;
    if (!authorizationHeader.startsWith("Bearer ")) return null;
    const token = authorizationHeader.slice("Bearer ".length).trim();
    return token.length ? token : null;
};

const getSocketAccessToken = (socket) => {
    const tokenFromAuthPayload = socket?.handshake?.auth?.token;
    if (typeof tokenFromAuthPayload === "string" && tokenFromAuthPayload.trim()) {
        return tokenFromAuthPayload.trim();
    }

    const tokenFromHeader = extractBearerToken(socket?.handshake?.headers?.authorization);
    if (tokenFromHeader) return tokenFromHeader;

    return null;
};

const socketAuthenticate = async (socket, packet, next) => {
    const [eventName] = packet;
    if (eventName !== "client:checkbox:change") {
        return next();
    }

    // Cache the authenticated user on the socket so we don't hit the DB on every checkbox toggle.
    if (socket.user) {
        return next();
    }

    const rejectUnauthorized = (message) => {
        socket.emit("server:error:unauthorized", { error: message });
        return next(new Error(message));
    };

    try {
        const token = getSocketAccessToken(socket);
        if (!token) {
            return rejectUnauthorized("Access token missing");
        }

        const decoded = verifyAccessToken(token);
        if (!decoded?.email) {
            return rejectUnauthorized("Invalid access token");
        }

        const [user] = await db.select().from(users).where(eq(users.email, decoded.email));
        if (!user) {
            return rejectUnauthorized("User not found");
        }

        socket.user = {
            id: user.id,
            email: user.email,
        };

        return next();
    } catch (error) {
        console.error("Socket authentication failed", error);
        return rejectUnauthorized("Authentication failed");
    }
};

export default socketAuthenticate;