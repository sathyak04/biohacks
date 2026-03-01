const fs = require("fs");
const path = require("path");

async function mutationRoutes(fastify) {
  const catalogPath = path.join(__dirname, "..", "..", "data", "mutation_catalog.json");

  // GET /api/catalog — Full mutation catalog for all genes
  fastify.get("/catalog", async (request, reply) => {
    if (!fs.existsSync(catalogPath)) {
      return reply.code(404).send({ error: "Catalog not found. Run generate_data.py first." });
    }
    return JSON.parse(fs.readFileSync(catalogPath, "utf-8"));
  });

  // GET /api/gene/:name — Get mutations for a specific gene
  fastify.get("/gene/:name", async (request, reply) => {
    if (!fs.existsSync(catalogPath)) {
      return reply.code(404).send({ error: "Catalog not found." });
    }
    const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf-8"));
    const gene = catalog[request.params.name.toUpperCase()];
    if (!gene) {
      return reply.code(404).send({ error: `Gene ${request.params.name} not found.` });
    }
    return gene;
  });
}

module.exports = mutationRoutes;
