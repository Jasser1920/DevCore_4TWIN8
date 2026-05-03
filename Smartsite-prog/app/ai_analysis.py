import base64
from openai import OpenAI

client = OpenAI()

async def file_to_base64(upload_file):
    content = await upload_file.read()
    return base64.b64encode(content).decode("utf-8")

async def analyze_progress(prototype, current_site):
    prototype_b64 = await file_to_base64(prototype)
    site_b64 = await file_to_base64(current_site)

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": """
You are an AI construction progress inspector.
Compare the prototype/reference image with the current site image.
Return only valid JSON.
"""
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": """
Analyze construction progress.

Return JSON with:
{
  "overall_progress": number,
  "completed_items": [],
  "missing_items": [],
  "changed_items": [],
  "risk_notes": [],
  "confidence": number
}
"""
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{prototype_b64}"
                        }
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{site_b64}"
                        }
                    }
                ]
            }
        ]
    )

    return response.choices[0].message.content