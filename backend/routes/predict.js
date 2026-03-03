const path = require("path");
const fs = require("fs");

let rfModel = null;
let metadata = null;

function loadModel() {
  if (rfModel && metadata) return;
  const modelPath = path.join(__dirname, "..", "model", "rf_model.json");
  const metaPath = path.join(__dirname, "..", "model", "metadata.json");

  if (fs.existsSync(modelPath) && fs.existsSync(metaPath)) {
    rfModel = JSON.parse(fs.readFileSync(modelPath, "utf-8"));
    metadata = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
  }
}

function predictProbabilities(featureVector) {
  const nClasses = rfModel.n_classes;
  const nTrees = rfModel.trees.length;

  let classProbs = new Array(nClasses).fill(0);

  for (const tree of rfModel.trees) {
    let node = 0;
    while (tree.children_left[node] !== -1) {
      const f = tree.feature[node];
      const t = tree.threshold[node];
      if (featureVector[f] <= t) {
        node = tree.children_left[node];
      } else {
        node = tree.children_right[node];
      }
    }

    // In scikit-learn, values are shape (n_nodes, 1, n_classes)
    const values = tree.value[node][0];
    const sum = values.reduce((a, b) => a + b, 0);
    for (let c = 0; c < nClasses; c++) {
      classProbs[c] += values[c] / sum;
    }
  }

  // Average across all trees
  for (let c = 0; c < nClasses; c++) {
    classProbs[c] /= nTrees;
  }
  return classProbs;
}

async function predictRoutes(fastify) {
  const metadataPath = path.join(__dirname, "..", "model", "metadata.json");

  fastify.post("/predict", async (request, reply) => {
    const { mutations } = request.body;

    if (!mutations || !Array.isArray(mutations) || mutations.length === 0) {
      return reply.code(400).send({ error: "Provide a non-empty mutations array." });
    }

    try {
      loadModel();
      if (!rfModel || !metadata) {
        return reply.code(500).send({ error: "Model not found. Please train and export the model first." });
      }

      const featureVector = metadata.features.map(f => mutations.includes(f) ? 1 : 0);
      const probabilities = predictProbabilities(featureVector);

      let predictions = [];
      const cancerTypes = metadata.cancer_types;
      for (let i = 0; i < cancerTypes.length; i++) {
        predictions.push({
          cancer_type: cancerTypes[i],
          probability: Math.round(probabilities[i] * 1000) / 10
        });
      }
      predictions.sort((a, b) => b.probability - a.probability);

      const top = predictions[0];

      return {
        top_prediction: top.cancer_type,
        top_probability: top.probability,
        all_predictions: predictions,
        mutations_analyzed: mutations,
        model_accuracy: metadata.accuracy
      };
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: "Prediction failed", details: err.message });
    }
  });

  fastify.get("/model-info", async (request, reply) => {
    if (!fs.existsSync(metadataPath)) {
      return reply.code(404).send({ error: "Model not trained yet." });
    }
    return JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
  });
}

module.exports = predictRoutes;
