import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { generateKeyPairSync } from "node:crypto";

const privateKeyPath = path.resolve("cert/private-key.pem");
const publicKeyPath = path.resolve("cert/public-key.pub");

let PRIVATE_KEY;
let PUBLIC_KEY;

if (existsSync(privateKeyPath) && existsSync(publicKeyPath)) {
	PRIVATE_KEY = readFileSync(privateKeyPath);
	PUBLIC_KEY = readFileSync(publicKeyPath);
} else {
	const { privateKey, publicKey } = generateKeyPairSync("rsa", {
		modulusLength: 2048,
		publicKeyEncoding: { type: "pkcs1", format: "pem" },
		privateKeyEncoding: { type: "pkcs1", format: "pem" },
	});

	PRIVATE_KEY = privateKey;
	PUBLIC_KEY = publicKey;
}

export { PRIVATE_KEY, PUBLIC_KEY };