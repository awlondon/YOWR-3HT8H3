from hlsf.pipeline import run_hlsf
from hlsf.settings import Settings
import os, json


def test_pipeline_llm_mock(tmp_path):
    json_out = tmp_path / "sf.json"
    text_out = tmp_path / "ans.txt"
    s = Settings()
    s.use_llm = True
    s.llm_provider = "mock"
    s.refine_passes = 2
    pkg, answer = run_hlsf("Explain a simple pendulum.", str(json_out), str(text_out), s)
    assert json_out.exists() and text_out.exists()
    data = json.loads(json_out.read_text(encoding="utf-8"))
    assert "space_field" in data and "tokens" in data["space_field"]
    assert len(data["space_field"]["expansions"]) >= 2
    assert len(data["space_field"]["triangles"]) >= 1
    assert answer.strip()
