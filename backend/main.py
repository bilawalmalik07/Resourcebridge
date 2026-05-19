from fastapi import FastAPI

app = FastAPI(title="ResourceBridge API")


@app.get("/")
def read_root():
    return {"status": "healthy", "project": "ResourceBridge"}
