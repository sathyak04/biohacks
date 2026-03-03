const path = require("path");
const fs = require("fs");

let rfModel = null;
let metadata = null;

function loadModel() {
  if (rfModel && metadata) return;
  const modelPath = path.join(__dirname, "..", "model", "rf_model.json");
  const metaPath = path.join(__dirname, "..", "model", "metadata.json");

  try {
    if (fs.existsSync(modelPath) && fs.existsSync(metaPath)) {
      rfModel = JSON.parse(fs.readFileSync(modelPath, "utf-8"));
      metadata = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
    }
  } catch (err) {
    console.error("Failed to parse model JSON:", err);
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
    // Protect against division by zero
    if (sum > 0) {
      for (let c = 0; c < nClasses; c++) {
        classProbs[c] += values[c] / sum;
      }
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
    let { mutations } = request.body || {};

    // Fallback if mutations array is missing or invalid
    if (!Array.isArray(mutations)) {
      mutations = [];
    }

    // Default fallback prediction in case anything goes wrong
    // This ensures the frontend never crashes and always gets a valid response format.
    const defaultPrediction = {
      cancer_type: "Unknown",
      probability: 0
    };

    const fallbackResponse = {
      top_prediction: defaultPrediction.cancer_type,
      top_probability: defaultPrediction.probability,
      all_predictions: [defaultPrediction],
      mutations_analyzed: mutations,
      model_accuracy: 0,
      warning: "Model unavailable or prediction failed. Returning fallback data."
    };

    try {
      loadModel();

      // If model failed to load, return fallback gracefully
      if (!rfModel || !metadata || !metadata.features || !metadata.cancer_types) {
        return reply.send(fallbackResponse);
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

      const top = predictions[0] || defaultPrediction;

      return reply.send({
        top_prediction: top.cancer_type,
        top_probability: top.probability,
        all_predictions: predictions,
        mutations_analyzed: mutations,
        model_accuracy: metadata.accuracy || 0
      });
    } catch (err) {
      fastify.log.error("Prediction Error:", err);
      // Failsafe: return the fallback response instead of a 500 status code
      return reply.send(fallbackResponse);
    }
  });

  fastify.get("/model-info", async (request, reply) => {
    try {
      if (!fs.existsSync(metadataPath)) {
        return reply.send({ error: "Model not trained yet." }); // Return 200 with error property
      }
      return reply.send(JSON.parse(fs.readFileSync(metadataPath, "utf-8")));
    } catch (err) {
      return reply.send({ error: "Failed to read model info." });
    }
  });
}

module.exports = predictRoutes;
