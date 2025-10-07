"""Analytical helpers for HLSF visualisations."""

from __future__ import annotations

import math
from typing import Dict, Iterable, List, Mapping

try:  # pragma: no cover - optional dependency
    import numpy as np
except Exception:  # pragma: no cover - environment without numpy
    np = None


def fft_magnitude_series(values: Iterable[float]) -> List[Dict[str, float]]:
    """Return the magnitude spectrum for a sequence of scalar values.

    The FFT is computed using ``numpy.fft.rfft`` so the output only contains
    the non-negative frequency components. The resulting magnitudes are
    returned as a list of dictionaries which is convenient for serialising to
    JSON for the web UI.
    """

    data = [float(v) for v in values]
    n = len(data)
    if n == 0:
        return []

    if np is not None:
        arr = np.array(data, dtype=float)
        arr = arr - arr.mean()
        spectrum = np.fft.rfft(arr)
        freqs = np.fft.rfftfreq(arr.size, d=1.0)
        mags = np.abs(spectrum)
        max_mag = mags.max(initial=0.0)
        if max_mag > 0.0:
            mags = mags / max_mag
        return [
            {"freq": float(freq), "magnitude": float(mag)}
            for freq, mag in zip(freqs, mags)
        ]

    # Fallback: compute a naive DFT when numpy is unavailable.
    mean = sum(data) / n
    centered = [v - mean for v in data]
    spectrum = []
    half_n = n // 2
    for k in range(half_n + 1):
        real = 0.0
        imag = 0.0
        for t, val in enumerate(centered):
            angle = 2 * math.pi * k * t / n
            real += val * math.cos(angle)
            imag -= val * math.sin(angle)
        magnitude = math.sqrt(real * real + imag * imag)
        spectrum.append((k / n, magnitude))
    max_mag = max((m for _, m in spectrum), default=0.0)
    if max_mag > 0.0:
        spectrum = [(freq, mag / max_mag) for freq, mag in spectrum]
    return [{"freq": freq, "magnitude": mag} for freq, mag in spectrum]


def glyph_stream(
    tokens: Iterable[str],
    expansions: Mapping[str, List[str]],
    glyph_lookup: Mapping[str, str],
) -> List[Dict[str, str]]:
    """Build an ordered glyph stream for the UI.

    The glyph stream interleaves the seed tokens and their two expansions so
    the front-end can display how symbolic glyphs propagate through the
    High-Level Space Field.
    """

    stream: List[Dict[str, str]] = []
    for idx, tok in enumerate(tokens):
        stream.append(
            {
                "id": f"t{idx}",
                "text": tok,
                "kind": "token",
                "glyph": glyph_lookup.get(tok, "?"),
            }
        )
        exps = expansions.get(tok, [])
        for e_idx, exp in enumerate(exps[:2]):
            stream.append(
                {
                    "id": f"t{idx}_e{e_idx+1}",
                    "text": exp,
                    "kind": "expansion",
                    "glyph": glyph_lookup.get(exp, "?"),
                }
            )
    return stream

