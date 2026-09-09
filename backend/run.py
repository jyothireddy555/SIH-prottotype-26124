import uvicorn
import os

if __name__ == "__main__":
    print("=" * 60)
    print("  AI Urban Intelligence Platform")
    print("  Smart India Hackathon (SIH26124)")
    print("  Backend running on: http://127.0.0.1:8000")
    print("  API Docs: http://127.0.0.1:8000/docs")
    print("=" * 60)
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
