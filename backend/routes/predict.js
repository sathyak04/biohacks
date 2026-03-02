const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

async function predictRoutes(fastify) {
  const pythonScript = path.join(__dirname, "..", "python", "predict.py");
  const metadataPath = path.join(__dirname, "..", "model", "metadata.json");

  // POST /api/predict — Mutation list -> cancer type prediction
  fastify.post("/predict", async (request, reply) => {
    const { mutations } = request.body;

    if (!mutations || !Array.isArray(mutations) || mutations.length === 0) {
      return reply.code(400).send({ error: "Provide a non-empty mutations array." });
    }

    const inputJson = JSON.stringify({ mutations });

    return new Promise((resolve) => {
      const proc = spawn("python", [`"${pythonScript}"`], { timeout: 15000, shell: true });

      let stdout = "";
      let stderr = "";

      proc.stdout.on("data", (data) => { stdout += data.toString(); });
      proc.stderr.on("data", (data) => { stderr += data.toString(); });

      proc.on("error", (err) => {
        fastify.log.error("Failed to spawn python: " + err.message);
        resolve(reply.code(500).send({ error: "Failed to start Python", details: err.message }));
      });

      proc.on("close", (code) => {
        if (code !== 0) {
          fastify.log.error(stderr);
          resolve(reply.code(500).send({ error: "Prediction failed", details: stderr }));
          return;
        }
        try {
          resolve(JSON.parse(stdout));
        } catch {
          resolve(reply.code(500).send({ error: "Failed to parse prediction output" }));
        }
      });

      // Send JSON via stdin instead of command-line arg (avoids Windows quoting issues)
      proc.stdin.write(inputJson);
      proc.stdin.end();
    });
  });

  // GET /api/model-info
  fastify.get("/model-info", async (request, reply) => {
    if (!fs.existsSync(metadataPath)) {
      return reply.code(404).send({ error: "Model not trained yet." });
    }
    return JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
  });
}

module.exports = predictRoutes;
