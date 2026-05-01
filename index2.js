import { createServer } from "node:http";
import path from "node:path";
import "dotenv/config";

import app from "./src/app/index.js"


export function startServer() {
    const PORT = process.env.PORT || 8000;
    const server = createServer(app);

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