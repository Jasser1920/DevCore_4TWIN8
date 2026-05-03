from pathlib import Path
import shutil

BASE_DIR = Path(__file__).resolve().parent

PROCESSED_DIR = BASE_DIR / "data" / "processed"
CORRECTED_DIR = BASE_DIR / "data" / "corrected_dataset"
FINAL_DIR = BASE_DIR / "data" / "final_dataset"

CLASSES = [
    "foundation",
    "plinth_beam",
    "lintel_beam",
    "multi_story",
    "flooring",
    "paint",
]

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def reset_final_dataset():
    if FINAL_DIR.exists():
        shutil.rmtree(FINAL_DIR)

    for split in ["train", "val"]:
        for class_name in CLASSES:
            (FINAL_DIR / split / class_name).mkdir(parents=True, exist_ok=True)


def copy_folder_images(src_dir: Path, dst_dir: Path, prefix: str):
    if not src_dir.exists():
        return 0

    count = 0

    for image_path in src_dir.iterdir():
        if image_path.is_file() and image_path.suffix.lower() in IMAGE_EXTENSIONS:
            dst_name = f"{prefix}_{image_path.name}"
            shutil.copy2(image_path, dst_dir / dst_name)
            count += 1

    return count


def main():
    reset_final_dataset()

    total = 0

    # Copy original processed train/val data
    for split in ["train", "val"]:
        for class_name in CLASSES:
            src = PROCESSED_DIR / split / class_name
            dst = FINAL_DIR / split / class_name

            copied = copy_folder_images(src, dst, prefix=f"original_{split}")
            total += copied
            print(f"{split}/{class_name}: copied {copied} original images")

    # Add corrected images into train only
    corrected_total = 0

    for class_name in CLASSES:
        src = CORRECTED_DIR / class_name
        dst = FINAL_DIR / "train" / class_name

        copied = copy_folder_images(src, dst, prefix="corrected")
        corrected_total += copied
        total += copied
        print(f"train/{class_name}: added {copied} corrected images")

    print()
    print(f"Final dataset created at: {FINAL_DIR}")
    print(f"Total images copied: {total}")
    print(f"Corrected images added to train: {corrected_total}")


if __name__ == "__main__":
    main()