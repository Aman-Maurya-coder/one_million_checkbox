import Redis from "ioredis";

function createRedisConnection() {
    const client = new Redis({
        host: "localhost",
        port: 6379,
    });

    client.on("error", (error) => {
        const message = error?.message || String(error);
        console.error("[redis] connection error:", message);
    });

    return client;
}

export const redis = createRedisConnection();
export const publisher = createRedisConnection();
export const subscriber = createRedisConnection();
