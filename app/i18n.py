import json
import os
from pathlib import Path
from typing import Any, Dict

SUPPORTED_LANGS = ["en", "hi", "kn", "ta"]


def _load_locale_files() -> Dict[str, Dict[str, Any]]:
    root = Path(__file__).resolve().parents[1]
    locales_dir = root / "locales"
    translations: Dict[str, Dict[str, Any]] = {}
    for lang in SUPPORTED_LANGS:
        fpath = locales_dir / f"{lang}.json"
        if fpath.exists():
            try:
                with open(fpath, "r", encoding="utf-8") as fh:
                    translations[lang] = json.load(fh)
            except Exception:
                translations[lang] = {}
        else:
            translations[lang] = {}
    return translations


_TRANSLATIONS = _load_locale_files()


def _resolve_key(data: Dict[str, Any], key: str):
    parts = key.split(".")
    cur = data
    for p in parts:
        if isinstance(cur, dict) and p in cur:
            cur = cur[p]
        else:
            return None
    return cur


class SafeDict(dict):
    def __missing__(self, key):
        return "{" + key + "}"


def get_text(key: str, lang: str = "en", **kwargs) -> str:
    """
    Fetch translation by dotted `key` for `lang`. Falls back to English when needed.
    Supports Python-style interpolation with keyword args.
    """
    if not lang or lang not in _TRANSLATIONS:
        lang = "en"

    # Try requested lang
    value = _resolve_key(_TRANSLATIONS.get(lang, {}), key)
    if value is None:
        # Fallback to English
        value = _resolve_key(_TRANSLATIONS.get("en", {}), key) or key

    # Perform simple interpolation
    try:
        return str(value).format_map(SafeDict(kwargs))
    except Exception:
        return str(value)


def best_match_from_header(accept_language_header: str) -> str:
    """Parse Accept-Language header and return best match from SUPPORTED_LANGS."""
    if not accept_language_header:
        return "en"

    parts = [p.strip() for p in accept_language_header.split(",") if p.strip()]
    candidates = []
    for part in parts:
        if ";q=" in part:
            lang_tag, q = part.split(";q=")
            try:
                weight = float(q)
            except Exception:
                weight = 1.0
        else:
            lang_tag = part
            weight = 1.0

        # Keep only primary tag (e.g. 'hi-IN' -> 'hi')
        primary = lang_tag.split("-")[0]
        candidates.append((primary, weight))

    # Sort by weight desc
    candidates.sort(key=lambda x: x[1], reverse=True)
    for cand, _ in candidates:
        if cand in SUPPORTED_LANGS:
            return cand

    return "en"
