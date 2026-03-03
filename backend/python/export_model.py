import os
import json
import joblib

def main():
    base_dir = os.path.dirname(__file__)
    model_dir = os.path.join(base_dir, "..", "model")
    model_path = os.path.join(model_dir, "cancer_model.joblib")
    
    print(f"Loading model from {model_path}...")
    model = joblib.load(model_path)
    
    trees_data = []
    for estimator in model.estimators_:
        tree = estimator.tree_
        tree_dict = {
            "children_left": tree.children_left.tolist(),
            "children_right": tree.children_right.tolist(),
            "feature": tree.feature.tolist(),
            "threshold": tree.threshold.tolist(),
            "value": tree.value.tolist() 
        }
        trees_data.append(tree_dict)
        
    export_data = {
        "n_classes": int(model.n_classes_),
        "n_features": int(model.n_features_in_),
        "trees": trees_data
    }
    
    out_path = os.path.join(model_dir, "rf_model.json")
    with open(out_path, "w") as f:
        json.dump(export_data, f)
        
    print(f"Exported Random Forest JSON to {out_path} ({os.path.getsize(out_path)/1024/1024:.2f} MB)")

if __name__ == "__main__":
    main()
