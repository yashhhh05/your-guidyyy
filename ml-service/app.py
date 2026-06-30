import os
import requests
import torch
from PIL import Image
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoModelForCausalLM, AutoProcessor

app = FastAPI(title="Tutor Vision API")

# Enable CORS so the Next.js app (local or deployed) can connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model and processor on startup (runs on CPU by default in Hugging Face Spaces free tier)
device = "cuda" if torch.cuda.is_available() else "cpu"
model_id = "microsoft/Florence-2-base"

print(f"Loading processor for {model_id}...")
processor = AutoProcessor.from_pretrained(model_id, trust_remote_code=True)
print(f"Loading model for {model_id} on {device}...")
model = AutoModelForCausalLM.from_pretrained(
    model_id, 
    trust_remote_code=True, 
    attn_implementation="eager"
).to(device)
model.eval()
print("Model loaded successfully!")

class AnalyzeRequest(BaseModel):
    image_url: str

@app.get("/")
def read_root():
    return {
        "status": "running", 
        "model": model_id, 
        "device": device,
        "info": "Post an image_url to /analyze to get a detailed transcription."
    }

@app.post("/analyze")
async def analyze_image(request: AnalyzeRequest):
    if not request.image_url:
        raise HTTPException(status_code=400, detail="Missing image_url")
    
    try:
        print(f"Downloading image from: {request.image_url}")
        # Add a custom User-Agent to avoid fetch failures on certain hosting providers
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        response = requests.get(request.image_url, headers=headers, timeout=20)
        if not response.ok:
            raise HTTPException(status_code=400, detail=f"Failed to fetch image: {response.status_code}")
        
        import io
        image = Image.open(io.BytesIO(response.content)).convert("RGB")
        print(f"Image successfully loaded! Type: {type(image)}, Size: {image.size}")
        
        # Florence-2 tasks:
        # We run '<MORE_DETAILED_CAPTION>' to describe the overall image and its text/context.
        # Alternatively, '<OCR>' can be used if you only want text transcription.
        task_prompt = "<MORE_DETAILED_CAPTION>"
        
        print(f"Running task: {task_prompt}")
        inputs = processor(text=task_prompt, images=image, return_tensors="pt").to(device)
        
        with torch.no_grad():
            generated_ids = model.generate(
                input_ids=inputs["input_ids"],
                pixel_values=inputs["pixel_values"],
                max_new_tokens=512,
                num_beams=3
            )
        
        generated_text = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
        parsed_answer = processor.post_process_generation(generated_text, task=task_prompt, image_size=image.size)
        
        description = parsed_answer[task_prompt]
        print(f"Analysis complete: {description}")
        return {"description": description}
        
    except Exception as e:
        import traceback
        print("EXCEPTION ENCOUNTERED RUNNING MODEL INFERENCE:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
