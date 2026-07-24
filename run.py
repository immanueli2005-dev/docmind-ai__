# run.py - DocMind AI FastAPI server launcher script

import uvicorn
import os
from dotenv import load_dotenv

if __name__ == "__main__":
    load_dotenv()
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    print(f"Starting DocMind AI FastAPI Server on http://{host}:{port}")
    print("Interactive Swagger documentation: http://localhost:8000/docs")
    
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
