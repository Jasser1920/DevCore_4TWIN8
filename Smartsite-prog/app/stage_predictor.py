from pathlib import Path
from fastapi import UploadFile
from ultralytics import YOLO
import tempfile
import os
import json
import shutil
from datetime import datetime
from uuid import uuid4


BASE_DIR = Path(__file__).resolve().parents[1]
MODEL_PATH = BASE_DIR / "runs" / "classify" / "train-3" / "weights" / "best.pt"

if not MODEL_PATH.exists():
    raise FileNotFoundError(f"Model not found at: {MODEL_PATH}")

model = YOLO(str(MODEL_PATH))


PROGRESS_MAP = {
    "foundation": 15,
    "plinth_beam": 30,
    "lintel_beam": 45,
    "multi_story": 60,
    "flooring": 80,
    "paint": 95,
}


STAGE_ORDER = [
    "foundation",
    "plinth_beam",
    "lintel_beam",
    "multi_story",
    "flooring",
    "paint",
]


def get_stage_description(stage: str) -> str:
    descriptions = {
        "foundation": "Foundation work stage. Early construction progress.",
        "plinth_beam": "Plinth beam stage. Base structural work is progressing.",
        "lintel_beam": "Lintel beam stage. Structural wall openings and supports are progressing.",
        "multi_story": "Multi-story structural stage. Main structure is under construction.",
        "flooring": "Flooring stage. Interior or finishing work has started.",
        "paint": "Paint stage. Final finishing stage, close to completion.",
    }

    return descriptions.get(stage, "Unknown construction stage.")


def get_review_status(confidence: float):
    if confidence >= 0.80:
        return {
            "review_status": "accepted",
            "review_message": "Prediction confidence is high."
        }

    if confidence >= 0.50:
        return {
            "review_status": "needs_review",
            "review_message": "Prediction confidence is moderate. Human review is recommended."
        }

    return {
        "review_status": "low_confidence",
        "review_message": "Prediction confidence is low. Human correction is required."
    }


def predict_image_path(image_path: str):
    results = model.predict(
        source=image_path,
        imgsz=224,
        device="cpu",
        verbose=False
    )

    result = results[0]
    probs = result.probs
    names = result.names

    scores = probs.data.tolist()
    ranking = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)

    top1_index = ranking[0]
    predicted_stage = names[top1_index]
    confidence = float(scores[top1_index])

    top_predictions = []
    for index in ranking[:5]:
        top_predictions.append({
            "stage": names[index],
            "confidence": round(float(scores[index]), 4)
        })

    estimated_progress = PROGRESS_MAP.get(predicted_stage, 0)
    review = get_review_status(confidence)

    return {
        "predicted_stage": predicted_stage,
        "estimated_progress": estimated_progress,
        "confidence": round(confidence, 4),
        "review_status": review["review_status"],
        "review_message": review["review_message"],
        "description": get_stage_description(predicted_stage),
        "top_predictions": top_predictions
    }


async def save_upload_to_temp(upload_file: UploadFile):
    suffix = Path(upload_file.filename).suffix or ".jpg"

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        temp_path = temp_file.name
        content = await upload_file.read()
        temp_file.write(content)

    return temp_path


async def predict_construction_stage(image: UploadFile):
    temp_path = await save_upload_to_temp(image)

    try:
        return predict_image_path(temp_path)

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


def get_stage_index(stage: str):
    try:
        return STAGE_ORDER.index(stage)
    except ValueError:
        return -1


async def compare_prototype_with_site(
    prototype: UploadFile,
    current_site: UploadFile,
    expected_stage_override: str | None = None
):
    prototype_path = await save_upload_to_temp(prototype)
    current_path = await save_upload_to_temp(current_site)

    try:
        prototype_result = predict_image_path(prototype_path)
        current_result = predict_image_path(current_path)

        current_stage = current_result["predicted_stage"]
        current_progress = current_result["estimated_progress"]

        if expected_stage_override:
            expected_stage = expected_stage_override
            expected_progress = PROGRESS_MAP.get(expected_stage, 0)

            prototype_result["manual_override"] = True
            prototype_result["predicted_stage_before_override"] = prototype_result["predicted_stage"]
            prototype_result["predicted_progress_before_override"] = prototype_result["estimated_progress"]
            prototype_result["predicted_confidence_before_override"] = prototype_result["confidence"]

            prototype_result["predicted_stage"] = expected_stage
            prototype_result["estimated_progress"] = expected_progress
            prototype_result["confidence"] = 1.0
            prototype_result["review_status"] = "manual_override"
            prototype_result["review_message"] = "Expected stage was manually provided by the user."
            prototype_result["description"] = get_stage_description(expected_stage)
        else:
            expected_stage = prototype_result["predicted_stage"]
            expected_progress = prototype_result["estimated_progress"]

        progress_gap = expected_progress - current_progress

        expected_index = get_stage_index(expected_stage)
        current_index = get_stage_index(current_stage)
        stage_gap = expected_index - current_index

        if progress_gap <= 0:
            status = "on_track_or_ahead"
            message = "The current site appears to be on track or ahead of the reference image."
        elif progress_gap <= 20:
            status = "slightly_behind"
            message = "The current site appears slightly behind the reference image."
        else:
            status = "behind"
            message = "The current site appears significantly behind the reference image."

        analysis_id = str(uuid4())

        images_dir = BASE_DIR / "data" / "analysis_images" / analysis_id
        images_dir.mkdir(parents=True, exist_ok=True)

        prototype_saved_path = images_dir / "prototype.jpg"
        current_saved_path = images_dir / "current_site.jpg"

        shutil.copy2(prototype_path, prototype_saved_path)
        shutil.copy2(current_path, current_saved_path)

        result = {
            "analysis_id": analysis_id,
            "created_at": datetime.utcnow().isoformat() + "Z",
            "prototype_image": str(prototype_saved_path),
            "current_site_image": str(current_saved_path),
            "expected": prototype_result,
            "current": current_result,
            "comparison": {
                "expected_stage": expected_stage,
                "current_stage": current_stage,
                "expected_progress": expected_progress,
                "current_progress": current_progress,
                "progress_gap": progress_gap,
                "stage_gap": stage_gap,
                "status": status,
                "message": message
            }
        }

        predictions_dir = BASE_DIR / "data" / "predictions"
        predictions_dir.mkdir(parents=True, exist_ok=True)

        output_path = predictions_dir / f"{analysis_id}.json"

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2)

        result["saved_to"] = str(output_path)

        return result

    finally:
        if os.path.exists(prototype_path):
            os.remove(prototype_path)

        if os.path.exists(current_path):
            os.remove(current_path)