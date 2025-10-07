"""FastAPI application exposing the interactive HLSF GUI."""

from __future__ import annotations

from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from ..pipeline import run_hlsf_in_memory
from ..settings import Settings

STATIC_DIR = Path(__file__).resolve().parent / "static"


class RunPayload(BaseModel):
    prompt: str
    use_llm: Optional[bool] = None
    passes: Optional[int] = None


def create_app() -> FastAPI:
    settings = Settings()
    app = FastAPI(title="HLSF Visual Cortex", version=settings.version)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

    @app.get("/")
    async def index() -> FileResponse:
        index_file = STATIC_DIR / "index.html"
        if not index_file.exists():
            raise HTTPException(status_code=500, detail="UI assets missing")
        return FileResponse(index_file)

    @app.post("/api/run")
    async def run(payload: RunPayload):
        if not payload.prompt.strip():
            raise HTTPException(status_code=422, detail="Prompt cannot be empty")
        settings = Settings()
        if payload.use_llm is not None:
            settings.use_llm = payload.use_llm
        if payload.passes is not None:
            settings.refine_passes = max(1, int(payload.passes))
        pkg, answer = run_hlsf_in_memory(payload.prompt, settings)
        return {"package": pkg, "answer": answer}

    return app


def run_gui(host: str = "127.0.0.1", port: int = 8000, open_browser: bool = True) -> None:
    import threading
    import webbrowser

    import uvicorn

    app = create_app()

    if open_browser:
        url = f"http://{host}:{port}"
        threading.Timer(1.0, lambda: webbrowser.open(url)).start()

    uvicorn.run(app, host=host, port=port, log_level="info")
