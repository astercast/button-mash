#!/usr/bin/env python3
"""Validate a function response envelope against data/v1/schema/envelope.json.
Implements the draft 2020-12 subset our schema uses: type (incl. type lists),
required, properties, pattern, enum, format:date-time, allOf/if/then/not.
Usage: curl -s $BASE/api/health | python3 tests/validate_envelope.py
Exit 0 = valid, non-zero with a message = invalid.
"""
import json
import re
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCHEMA = json.loads((ROOT / "data" / "v1" / "schema" / "envelope.json").read_text())

errors = []


def check_date_time(v, path):
    try:
        s = v.replace("Z", "+00:00") if v.endswith("Z") else v
        datetime.fromisoformat(s)
    except Exception:
        errors.append(f"{path}: not RFC3339 date-time: {v!r}")


_silent = []


def check_type(v, t, path):
    global errors
    if isinstance(t, list):
        # try each alternative without recording misses
        saved, errors = errors, _silent
        hit = False
        for x in t:
            if check_type(v, x, path):
                hit = True
                break
        errors = saved
        if not hit:
            errors.append(f"{path}: type {type(v).__name__} not in {t}")
            return False
        return True
    want = {
        "object": dict, "array": list, "string": str,
        "boolean": bool, "integer": int, "null": type(None),
        "number": (int, float),
    }[t]
    if t == "integer" and isinstance(v, bool):
        ok = False
    else:
        ok = isinstance(v, want)
    if not ok:
        errors.append(f"{path}: expected {t}, got {type(v).__name__}")
    return ok


def validate(v, sch, path="$"):
    if "type" in sch:
        if not check_type(v, sch["type"], path):
            return
    if "enum" in sch and v not in sch["enum"]:
        errors.append(f"{path}: {v!r} not in enum {sch['enum']}")
    if "pattern" in sch and isinstance(v, str):
        if not re.search(sch["pattern"], v):
            errors.append(f"{path}: {v!r} does not match {sch['pattern']}")
    if "format" in sch and sch["format"] == "date-time" and isinstance(v, str):
        check_date_time(v, path)
    if isinstance(v, dict):
        for req in sch.get("required", []):
            if req not in v:
                errors.append(f"{path}: missing required {req!r}")
        for k, sub in sch.get("properties", {}).items():
            if k in v:
                validate(v[k], sub, f"{path}.{k}")
    if isinstance(v, list) and "items" in sch:
        for i, item in enumerate(v):
            validate(item, sch["items"], f"{path}[{i}]")
    for clause in sch.get("allOf", []):
        cond = clause.get("if")
        if cond and matches(v, cond):
            validate(v, clause.get("then", {}), path)
        elif cond:
            validate(v, clause.get("else", {}), path)


def matches(v, sch):
    # boolean-schema evaluation for if/then
    if "properties" in sch:
        for k, sub in sch["properties"].items():
            if "const" in sub and (k not in v or v[k] != sub["const"]):
                return False
    return True


def main():
    doc = json.load(sys.stdin)
    validate(doc, SCHEMA)
    # handle the "not required" branch for ok:true manually
    if doc.get("ok") is True and "error" in doc:
        errors.append("$.error: must be absent when ok is true")
    if errors:
        print("ENVELOPE INVALID:")
        for e in errors:
            print(" -", e)
        sys.exit(1)
    print("envelope valid")


main()
