require("dotenv").config();
const path = require("path");
const fastify = require("fastify")({ logger: true });

fastify.register(require("@fastify/cors"), { origin: true });
fastify.register(require("@fastify/static"), {
  root: path.join(__dirname, "..", "data"),
  prefix: "/data/",
  decorateReply: false,
});
fastify.register(require("./routes/mutations"), { prefix: "/api" });
fastify.register(require("./routes/predict"), { prefix: "/api" });
fastify.register(require("./routes/chat"), { prefix: "/api" });

// Serve built frontend in production
const frontendDist = path.join(__dirname, "..", "frontend", "dist");
if (require("fs").existsSync(frontendDist)) {
  fastify.register(require("@fastify/static"), {
    root: frontendDist,
    prefix: "/",
  });
  // SPA fallback — serve index.html for non-API routes
  fastify.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith("/api")) {
      reply.code(404).send({ error: "Not found" });
    } else {
      reply.sendFile("index.html");
    }
  });
}

fastify.get("/api/health", async () => ({ status: "ok" }));

const start = async () => {
  try {
    const port = process.env.PORT || 3001;
    await fastify.listen({ port, host: "0.0.0.0" });
    console.log(`MutationMap API running on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
