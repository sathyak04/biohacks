const Groq = require("groq-sdk");

async function chatRoutes(fastify) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  // POST /api/chat — AI explains mutation/prediction results
  fastify.post("/chat", async (request, reply) => {
    const { message, prediction, activeMutations } = request.body;

    if (!message) {
      return reply.code(400).send({ error: "Message is required." });
    }

    const systemPrompt = `You are MutationMap AI, a friendly cancer genomics assistant embedded in a mutation analysis tool. You help users understand their mutation selections and cancer type predictions.

Context about the tool:
- Users select mutations from 6 genes and the tool predicts cancer type using a Random Forest ML model
- Driver mutations actively cause cancer; passenger mutations are harmless bystanders
- Available genes and their driver mutations in this tool:
  * TP53 (Tumor Protein P53, tumor suppressor): R175H, R248W, R248Q, R273H, R273C, G245S, R249S, Y220C, C176F, R282W, V157F, R158L, H179R
  * BRCA1 (Breast Cancer Gene 1, DNA repair): 185delAG, 5382insC, C68G, M1775R, A1685T, C61G, Q1613X, E871X
  * BRCA2 (Breast Cancer Gene 2, DNA repair): 6174delT, 999del5, T2336I, D3036E, D2723H, E1420Q, E886del
  * KRAS (Proto-Oncogene, RAS/MAPK signaling): G12D, G12V, G12C, G12A, G12R, G13D, Q61H, Q61L, A146T
  * BRAF (Proto-Oncogene, MAPK/ERK kinase): V600E, V600K, K601E, L597V, G469A, G466V, D594G
  * PIK3CA (PI3K Catalytic Subunit, PI3K/AKT pathway): H1047R, E545K, E542K, H1047L, N345K, C420R, E546K, S726F, G1049R
- Cancer types the model predicts: breast, colorectal, ovarian, lung, brain, liver, pancreatic, bladder, skin, esophageal, prostate

IMPORTANT: Only reference mutations that exist in the lists above. Do not mention mutations that are not available in this tool. If asked about mutations we don't have, say they are not included in this tool's curated set.

${prediction ? `Current prediction results:
- Top prediction: ${prediction.top_prediction} (${prediction.top_probability}%)
- All probabilities: ${prediction.all_predictions.map(p => `${p.cancer_type}: ${p.probability}%`).join(", ")}
- Mutations analyzed: ${prediction.mutations_analyzed.join(", ")}
- Model accuracy: ${(prediction.model_accuracy * 100).toFixed(1)}%` : "No prediction has been run yet."}

${activeMutations && activeMutations.length > 0 ? `Currently selected mutations: ${activeMutations.join(", ")}` : "No mutations selected yet."}

Keep responses concise (2-4 sentences). Be scientifically accurate but accessible. If asked about specific mutations, explain their biological significance. When suggesting mutations to try, only suggest ones from the available lists above.`;

    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.7,
        max_tokens: 300,
      });

      return { response: completion.choices[0].message.content };
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ error: "AI request failed", details: err.message });
    }
  });
}

module.exports = chatRoutes;
