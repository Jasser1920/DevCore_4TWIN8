from pathlib import Path
import json
import shutil

BASE_DIR = Path(__file__).resolve().parent
LABELS_FILE = BASE_DIR / "data" / "training_labels.jsonl"
OUT_DIR = BASE_DIR / "data" / "corrected_dataset"


def clean_previous_output():
    if OUT_DIR.exists():
        shutil.rmtree(OUT_DIR)


def copy_image_to_class(image_path: str, class_name: str, analysis_id: str):
    if not image_path:
        return False

    src = Path(image_path)

    if not src.exists():
        print(f"Missing image: {src}")
        return False

    class_dir = OUT_DIR / class_name
    class_dir.mkdir(parents=True, exist_ok=True)

    suffix = src.suffix or ".jpg"
    dst = class_dir / f"{analysis_id}{suffix}"

    shutil.copy2(src, dst)
    return True


def main():
    if not LABELS_FILE.exists():
        print(f"Missing labels file: {LABELS_FILE}")
        return

    clean_previous_output()

    copied = 0
    skipped = 0

    with open(LABELS_FILE, "r", encoding="utf-8") as f:
        for line in f:
            row = json.loads(line)

            analysis_id = row.get("analysis_id")
            current_site_image = row.get("current_site_image")
            corrected_current_stage = row.get("corrected_current_stage")

            if not current_site_image or not corrected_current_stage:
                skipped += 1
                continue

            ok = copy_image_to_class(
                image_path=current_site_image,
                class_name=corrected_current_stage,
                analysis_id=analysis_id,
            )

            if ok:
                copied += 1
            else:
                skipped += 1

    print(f"Copied: {copied}")
    print(f"Skipped: {skipped}")
    print(f"Corrected dataset saved to: {OUT_DIR}")


if __name__ == "__main__":
    main()