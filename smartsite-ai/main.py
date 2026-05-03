from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from services.detection_service import analyze_image
from services.chat_service import get_chat_response

app = FastAPI()

class ChatRequest(BaseModel):
    message: str

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

@app.post("/chat")
async def chat(request: ChatRequest):
    response_text = get_chat_response(request.message)
    return {
        "success": True,
        "response": response_text
    }