import http from "node:http";
import path from "node:path";

import express from "express";
import { Server } from "socket.io";
import { publisher, subscriber, redis } from "./redis-connection.js";


const CHECKBOX_COUNT = 2000;
const CHECKBOX_STATE_KEY = "checkbox_state";


async function main() {
    const PORT = process.env.PORT || 8000;

    const app = express();
    const server = http.createServer(app);
    const io = new Server();
    io.attach(server);
    

    await subscriber.subscribe("internal-server:checkbox:change")
    subscriber.on('message', (channel, message) => {
        if(channel === "internal-server:checkbox:change") {
            const { index, checked } = JSON.parse(message);
            io.emit("server:checkbox:change", { index, checked });
        }
    })

    // Socket.io handlers
    io.on("connection", (socket) => {
        console.log("Socket connected: " + socket.id);

        socket.on("client:checkbox:change", async (data) => {
            console.log("Received checkbox change from client:", {socketId: socket.id, ...data});
            const { socketId, index, checked } = data;
            const lastUpdateTime = await redis.get(`checkbox_update_time:${socket.id}`);
            // if(!lastUpdateTime){
            //     await redis.set(`checkbox_update_time:${socket.id}`, Date.now());
            //     await publisher.publish("internal-server:checkbox:change", JSON.stringify({ index, checked }));
            //     return;
            // }
            if(lastUpdateTime){
                const timeElapsedTillLastUpdate = Date.now() - lastUpdateTime;
                if(timeElapsedTillLastUpdate < 5500){
                    console.log(`Ignoring checkbox change from socket ${socket.id} due to rate limit. Time elapsed since last update: ${timeElapsedTillLastUpdate}ms`);
                    socket.emit("server:error:rate_limit", { error: "You're changing checkboxes too quickly. Please wait a moment before trying again." });
                    return;
                } else {
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
                    await publisher.publish("internal-server:checkbox:change", JSON.stringify({ index, checked }));
                }
            }
            await redis.set(`checkbox_update_time:${socket.id}`, Date.now());
        })

        socket.on("disconnect", () => {
            console.log("Socket disconnected: " + socket.id);
        })
    })

    // Express handlers
    app.use(express.static(path.resolve('./public')));

    app.get("/health", (req, res) => {
        res.json({ healthy: true });
    })

    app.get("/checkboxes", async (req, res) => {
        const existingState = await redis.get(CHECKBOX_STATE_KEY);
        if (existingState) {
            return res.json({ checkboxes: JSON.parse(existingState) });
        }
        return res.json({ checkboxes: new Array(CHECKBOX_COUNT).fill(false) });
    })

    server.listen(PORT, () => {
        console.log(`Server is running on: http://localhost:${PORT}`);
    })
}

main();