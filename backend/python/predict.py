"""
Predict cancer type from a mutation profile.
Reads JSON from stdin: {"mutations": ["TP53_R175H", "BRCA1_185delAG"]}
"""

import sys
import os
import json
import warnings
import joblib
import pandas as pd

warnings.filterwarnings("ignore")


def main():
    # Read from stdin
    input_text = sys.stdin.read().strip()
    if not input_text:
        print(json.dumps({"error": "No input provided"}))
        sys.exit(1)

    model_dir = os.path.join(os.path.dirname(__file__), "..", "model")
    model_path = os.path.join(model_dir, "cancer_model.joblib")
    le_path = os.path.join(model_dir, "label_encoder.joblib")
    meta_path = os.path.join(model_dir, "metadata.json")

    if not os.path.exists(model_path):
        print(json.dumps({"error": "Model not found. Run train_model.py first."}))
        sys.exit(1)

    model = joblib.load(model_path)
    le = joblib.load(le_path)
    with open(meta_path) as f:
        metadata = json.load(f)

    features = metadata["features"]
    input_data = json.loads(input_text)
    mutations = input_data.get("mutations", [])

    # Build binary feature vector
    feature_vector = [1 if f in mutations else 0 for f in features]
    X = pd.DataFrame([feature_vector], columns=features)

    probabilities = model.predict_proba(X)[0]
    cancer_types = le.classes_

    # Build sorted predictions
    predictions = []
    for i, cancer in enumerate(cancer_types):
        predictions.append({
            "cancer_type": cancer,
            "probability": round(float(probabilities[i]) * 100, 1),
        })
    predictions.sort(key=lambda x: x["probability"], reverse=True)

    top = predictions[0]

    print(json.dumps({
        "top_prediction": top["cancer_type"],
        "top_probability": top["probability"],
        "all_predictions": predictions,
        "mutations_analyzed": mutations,
        "model_accuracy": metadata["accuracy"],
    }))


if __name__ == "__main__":
    main()
