from pathlib import Path
import json

BASE_DIR = Path(__file__).resolve().parent
CORRECTIONS_DIR = BASE_DIR / "data" / "corrections"
OUTPUT_FILE = BASE_DIR / "data" / "training_labels.jsonl"


def main():
    if not CORRECTIONS_DIR.exists():
        print("No corrections folder found.")
        return

    rows = []

    for path in CORRECTIONS_DIR.glob("*.json"):
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        correction = data.get("correction", {})
        original = data.get("original_prediction", {})

        row = {
            "analysis_id": data.get("analysis_id"),

            "prototype_image": original.get("prototype_image"),
            "current_site_image": original.get("current_site_image"),

            "corrected_expected_stage": correction.get("corrected_expected_stage"),
            "corrected_expected_progress": correction.get("corrected_expected_progress"),
            "corrected_current_stage": correction.get("corrected_current_stage"),
            "corrected_current_progress": correction.get("corrected_current_progress"),

            "notes": correction.get("notes"),

            "original_expected_stage": original.get("comparison", {}).get("expected_stage"),
            "original_current_stage": original.get("comparison", {}).get("current_stage"),
            "original_expected_progress": original.get("comparison", {}).get("expected_progress"),
            "original_current_progress": original.get("comparison", {}).get("current_progress"),
        }

        rows.append(row)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row) + "\n")

    print(f"Exported {len(rows)} corrected labels to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()