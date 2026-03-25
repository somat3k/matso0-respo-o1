from pathlib import Path
import joblib
import numpy as np
from sklearn.preprocessing import StandardScaler


def train_stub(output_dir: str = "artifacts") -> None:
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)
    X = np.array([[1.0, 10.0], [2.0, 20.0], [3.0, 30.0]])
    scaler = StandardScaler().fit(X)
    joblib.dump(scaler, out / "feature_scaler.joblib")
    print(f"wrote {out / 'feature_scaler.joblib'}")


if __name__ == "__main__":
    train_stub()
