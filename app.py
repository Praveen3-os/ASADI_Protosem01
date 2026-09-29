from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os
from dotenv import load_dotenv

from src.agent import ReelScriptAgent

# Load environment variables
load_dotenv()

app = FastAPI(title="Reel Script Builder API")

# Allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize our agent
agent = ReelScriptAgent()

class ScriptRequest(BaseModel):
    topic: str
    tone: str = "engaging"

@app.post("/api/generate")
async def generate_reel_script(request: ScriptRequest):
    response = agent.generate_script(request.topic, request.tone)
    return response

# Serve static files for frontend
app.mount("/static", StaticFiles(directory="frontend"), name="static")

@app.get("/")
async def read_index():
    return FileResponse("frontend/index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
