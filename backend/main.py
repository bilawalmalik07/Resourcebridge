from fastapi import FastAPI  # type: ignore

app = FastAPI(title="ResourceBridge API")


@app.get("/")
def read_root():
    return {"status": "healthy", "project": "ResourceBridge"}
