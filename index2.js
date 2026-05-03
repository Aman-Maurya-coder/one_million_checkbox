import { createServer } from "node:http";
import "dotenv/config";
import { Server } from "socket.io";

import app from "./src/app/index.js"
import { publisher, subscriber, redis } from "./redis-connection.js";
import socketAuthenticate from "./src/app/modules/auth/auth.socket.middleware.js";

const CHECKBOX_COUNT = 2000;
const CHECKBOX_STATE_KEY = "checkbox_state";


export function startServer() {
    const PORT = process.env.PORT || 8000;
    const server = createServer(app);

    const io = new Server(server);

    subscriber.subscribe("internal-server:checkbox:change").catch((error) => {
        console.error("Failed to subscribe to checkbox channel", error);
    });

    subscriber.on("message", (channel, message) => {
        if (channel === "internal-server:checkbox:change") {
            const { index, checked } = JSON.parse(message);
            io.emit("server:checkbox:change", { index, checked });
        }
    });

    io.on("connection", (socket) => {
        console.log("Socket connected: " + socket.id);
        socket.use((packet, next) => socketAuthenticate(socket, packet, next));
        socket.on("client:checkbox:change", async (data) => {
            try {
                const { index, checked } = data;

                const lastUpdateTime = await redis.get(`checkbox_update_time:${socket.id}`);
                if (lastUpdateTime) {
                    const timeElapsedTillLastUpdate = Date.now() - Number(lastUpdateTime);
                    if (timeElapsedTillLastUpdate < 5500) {
                        socket.emit("server:error:rate_limit", {
                            error: "You're changing checkboxes too quickly. Please wait a moment before trying again.",
                        });
                        return;
                    }
                }

                const existingState = await redis.get(CHECKBOX_STATE_KEY);
                if (existingState) {
                    const checkboxes = JSON.parse(existingState);
                    checkboxes[index] = checked;
                    await redis.set(CHECKBOX_STATE_KEY, JSON.stringify(checkboxes));
                } else {
                    const checkboxes = new Array(CHECKBOX_COUNT).fill(false);
                    checkboxes[index] = checked;
                    await redis.set(CHECKBOX_STATE_KEY, JSON.stringify(checkboxes));
                }

                await publisher.publish(
                    "internal-server:checkbox:change",
                    JSON.stringify({ index, checked })
                );

                await redis.set(`checkbox_update_time:${socket.id}`, Date.now().toString());
            } catch (error) {
                console.error("Failed to process checkbox change", error);
            }
        });

        socket.on("disconnect", () => {
            console.log("Socket disconnected: " + socket.id);
        });
    });

    server.listen(PORT, () => {
        console.log(`Server is started on port ${PORT}`);
    });
}

try {
    startServer();
} catch (error) {
    console.log("Failed to start the server", error);
    process.exit(1);
}