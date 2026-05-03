import os
import requests
from dotenv import load_dotenv
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={api_key}"
data = {
    "contents": [{"parts": [{"text": "hello"}]}]
}
response = requests.post(url, headers={"Content-Type": "application/json"}, json=data)
print("Status Code:", response.status_code)
print("Response:", response.text)
