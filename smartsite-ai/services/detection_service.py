from ultralytics import YOLO
import cv2
import numpy as np

# Load YOLO model
model = YOLO("runs/detect/train2/weights/best.pt")
def analyze_image(image_bytes):

    np_arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    results = model(img)

    persons = 0
    helmets = 0
    vests = 0
    no_helmet = 0
    no_vest = 0

    for r in results:
        for box in r.boxes:
            class_id = int(box.cls[0])
            class_name = model.names[class_id]

            if class_name == "person":
                persons += 1
            elif class_name == "helmet":
                helmets += 1
            elif class_name == "vest":
                vests += 1
            elif class_name == "no-helmet":
                no_helmet += 1
            elif class_name == "no-vest":
                no_vest += 1

    compliance = 0
    if persons > 0:
        compliance = int(((helmets + vests) / (persons * 2)) * 100)

    return {
        "persons": persons,
        "helmets": helmets,
        "vests": vests,
        "no_helmet": no_helmet,
        "no_vest": no_vest,
        "ppe_compliance_percent": compliance
    }