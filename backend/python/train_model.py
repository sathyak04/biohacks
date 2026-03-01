"""
Train a Random Forest classifier: mutation profile -> cancer type prediction.
"""

import os
import json
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from sklearn.preprocessing import LabelEncoder
import joblib


def main():
    base_dir = os.path.dirname(__file__)
    data_path = os.path.join(base_dir, "..", "..", "data", "training_data.csv")
    model_dir = os.path.join(base_dir, "..", "model")
    os.makedirs(model_dir, exist_ok=True)

    print("Loading training data...")
    df = pd.read_csv(data_path)
    print(f"  Shape: {df.shape}")

    feature_cols = [c for c in df.columns if c != "cancer_type"]
    X = df[feature_cols]
    y = df["cancer_type"]

    le = LabelEncoder()
    y_encoded = le.fit_transform(y)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )

    print("\nTraining Random Forest Classifier...")
    model = RandomForestClassifier(
        n_estimators=200,
        random_state=42,
        class_weight="balanced",
        max_depth=15,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    report_text = classification_report(y_test, y_pred, target_names=le.classes_)
    report_dict = classification_report(y_test, y_pred, target_names=le.classes_, output_dict=True)

    print(f"\nAccuracy: {accuracy:.4f}")
    print("\nClassification Report:")
    print(report_text)

    # Feature importances
    importances = dict(zip(feature_cols, [round(float(x), 4) for x in model.feature_importances_]))
    top_features = sorted(importances.items(), key=lambda x: x[1], reverse=True)[:10]
    print(f"\nTop 10 features: {top_features}")

    # Save
    model_path = os.path.join(model_dir, "cancer_model.joblib")
    joblib.dump(model, model_path)
    print(f"\nModel saved -> {model_path}")

    # Save label encoder
    le_path = os.path.join(model_dir, "label_encoder.joblib")
    joblib.dump(le, le_path)

    metadata = {
        "features": feature_cols,
        "cancer_types": list(le.classes_),
        "accuracy": round(accuracy, 4),
        "classification_report": report_dict,
        "top_features": dict(top_features),
        "training_samples": len(X_train),
        "test_samples": len(X_test),
    }
    meta_path = os.path.join(model_dir, "metadata.json")
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"Metadata saved -> {meta_path}")


if __name__ == "__main__":
    main()
