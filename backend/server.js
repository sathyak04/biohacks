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

fastify.get("/api/health", async () => ({ status: "ok" }));

const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: "0.0.0.0" });
    console.log("MutationMap API running on http://localhost:3001");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
