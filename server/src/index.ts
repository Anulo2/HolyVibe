import { env } from "./env";
import { app } from "./orpc/app";

console.log("🦊 Starting HolyVibe server with oRPC...");

const server = app.listen(env.PORT, () => {
	console.log(`🚀 oRPC Server running on port ${env.PORT}`);
	console.log(`📊 Database: ${env.DATABASE_URL}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
	console.log("🛑 SIGTERM received, shutting down gracefully");
	server.stop();
	process.exit(0);
});

process.on("SIGINT", () => {
	console.log("🛑 SIGINT received, shutting down gracefully");
	server.stop();
	process.exit(0);
});
