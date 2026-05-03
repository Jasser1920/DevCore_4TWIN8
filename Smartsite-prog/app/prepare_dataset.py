from pathlib import Path
import shutil
import random

RAW_DIR = Path("data/raw/dataset")
OUT_DIR = Path("data/processed")

CLASS_MAP = {
    "Foundation": "foundation",
    "Plinth Beam": "plinth_beam",
    "Lintel Beam": "lintel_beam",
    "Multi-story": "multi_story",
    "Flooring level": "flooring",
    "Paint": "paint",
}

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

random.seed(42)

def reset_output_folder():
    if OUT_DIR.exists():
        shutil.rmtree(OUT_DIR)

    for split in ["train", "val"]:
        for class_name in CLASS_MAP.values():
            (OUT_DIR / split / class_name).mkdir(parents=True, exist_ok=True)

def copy_images():
    total_images = 0

    for raw_class_name, clean_class_name in CLASS_MAP.items():
        class_dir = RAW_DIR / raw_class_name

        if not class_dir.exists():
            print(f"Missing folder: {class_dir}")
            continue

        images = [
            p for p in class_dir.iterdir()
            if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS
        ]

        random.shuffle(images)

        split_index = int(len(images) * 0.8)
        train_images = images[:split_index]
        val_images = images[split_index:]

        for split, split_images in [
            ("train", train_images),
            ("val", val_images),
        ]:
            for image_path in split_images:
                target_path = OUT_DIR / split / clean_class_name / image_path.name
                shutil.copy2(image_path, target_path)

        print(
            f"{clean_class_name}: "
            f"{len(train_images)} train, {len(val_images)} val"
        )

        total_images += len(images)

    print(f"\nDone. Total images copied: {total_images}")
    print(f"Processed dataset saved to: {OUT_DIR}")

if __name__ == "__main__":
    reset_output_folder()
    copy_images()