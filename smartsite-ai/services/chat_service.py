import os
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Try to get the API key from environment variables
api_key = os.getenv("GEMINI_API_KEY")

system_instruction = (
    "You are SiteBrain, the AI Assistant for the SmartSite platform. "
    "SmartSite is a comprehensive project management and safety platform for construction sites. "
    "Your job is to answer questions politely, concisely, and accurately based ONLY on the context provided. "
    "The user prompt will contain a [CURRENT USER] block indicating the user's role and email, and a [SYSTEM CONTEXT] block with data they are authorized to see. "
    "CRITICAL: You must strictly respect the user's role! If the user asks for information not present in the SYSTEM CONTEXT, you must politely decline and state that they do not have the required permissions or the data is not available. "
    "IMPORTANT ACTIONS: If the user asks you to extract, export, or download user information as a PDF, you MUST include the exact string [ACTION:EXPORT_USERS_PDF] in your response. "
    "If the user asks you to extract, export, or download company information as a PDF, you MUST include the exact string [ACTION:EXPORT_COMPANIES_PDF] in your response."
)

def get_chat_response(prompt: str) -> str:
    """Sends a prompt to the Gemini REST API and returns the response."""
    if not api_key:
         return "Error: GEMINI_API_KEY environment variable is not set. Please set it to use the chat feature."
         
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={api_key}"
        
        headers = {
            "Content-Type": "application/json"
        }
        
        data = {
            "system_instruction": {
                "parts": [{"text": system_instruction}]
            },
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ]
        }
        
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        
        result = response.json()
        return result["candidates"][0]["content"]["parts"][0]["text"]
        
    except Exception as e:
        return f"Error communicating with AI: {str(e)}"
