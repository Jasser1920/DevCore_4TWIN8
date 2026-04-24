from fastapi import FastAPI, UploadFile, File
from services.detection_service import analyze_image

app = FastAPI()

@app.get("/")
def health_check():
    return {"status": "SmartSite AI running 🚀"}

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):

    image_bytes = await file.read()
    result = analyze_image(image_bytes)

    return {
        "success": True,
        "data": result
    }