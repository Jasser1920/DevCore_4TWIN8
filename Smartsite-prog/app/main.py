from pathlib import Path
import json
from datetime import datetime

from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel

from app.stage_predictor import (
    predict_construction_stage,
    compare_prototype_with_site,
)


BASE_DIR = Path(__file__).resolve().parents[1]

app = FastAPI(title="SmartSite AI Progress API")


class CorrectionRequest(BaseModel):
    analysis_id: str
    corrected_expected_stage: str | None = None
    corrected_expected_progress: int | None = None
    corrected_current_stage: str | None = None
    corrected_current_progress: int | None = None
    notes: str | None = None


@app.get("/")
def home():
    return {
        "message": "SmartSite AI Progress API is running"
    }


@app.post("/predict-stage")
async def predict_stage(image: UploadFile = File(...)):
    result = await predict_construction_stage(image)
    return result


@app.post("/compare-progress")
async def compare_progress(
    prototype: UploadFile = File(...),
    current_site: UploadFile = File(...),
    expected_stage: str | None = None
):
    result = await compare_prototype_with_site(
        prototype=prototype,
        current_site=current_site,
        expected_stage_override=expected_stage
    )
    return result


@app.post("/correct-analysis")
def correct_analysis(correction: CorrectionRequest):
    prediction_path = BASE_DIR / "data" / "predictions" / f"{correction.analysis_id}.json"

    if not prediction_path.exists():
        raise HTTPException(status_code=404, detail="Analysis not found")

    with open(prediction_path, "r", encoding="utf-8") as f:
        original = json.load(f)

    correction_data = {
        "analysis_id": correction.analysis_id,
        "created_at": datetime.utcnow().isoformat() + "Z",
        "correction": correction.model_dump(),
        "original_prediction": original
    }

    corrections_dir = BASE_DIR / "data" / "corrections"
    corrections_dir.mkdir(parents=True, exist_ok=True)

    correction_path = corrections_dir / f"{correction.analysis_id}.json"

    with open(correction_path, "w", encoding="utf-8") as f:
        json.dump(correction_data, f, indent=2)

    return {
        "message": "Correction saved",
        "analysis_id": correction.analysis_id,
        "saved_to": str(correction_path)
    }

    
@app.get("/analysis-history")
def analysis_history():
    predictions_dir = BASE_DIR / "data" / "predictions"

    if not predictions_dir.exists():
        return {
            "count": 0,
            "items": []
        }

    items = []

    for path in predictions_dir.glob("*.json"):
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        items.append({
            "analysis_id": data.get("analysis_id"),
            "created_at": data.get("created_at"),
            "expected_stage": data.get("comparison", {}).get("expected_stage"),
            "current_stage": data.get("comparison", {}).get("current_stage"),
            "expected_progress": data.get("comparison", {}).get("expected_progress"),
            "current_progress": data.get("comparison", {}).get("current_progress"),
            "progress_gap": data.get("comparison", {}).get("progress_gap"),
            "status": data.get("comparison", {}).get("status"),
            "saved_to": str(path)
        })

    items.sort(key=lambda x: x.get("created_at") or "", reverse=True)

    return {
        "count": len(items),
        "items": items
    }


@app.get("/analysis/{analysis_id}")
def get_analysis(analysis_id: str):
    prediction_path = BASE_DIR / "data" / "predictions" / f"{analysis_id}.json"

    if not prediction_path.exists():
        raise HTTPException(status_code=404, detail="Analysis not found")

    with open(prediction_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    return data