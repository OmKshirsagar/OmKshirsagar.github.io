#!/usr/bin/env python3
"""
Whitelabel transform.

Reads data/portfolio.local.yml (master, contains real client / product /
persona names) and writes data/portfolio.yml (anonymized, safe-to-commit).

The actual real-name → anonymized mappings live in a SEPARATE gitignored
file:

    scripts/whitelabel.secrets.local.json

The contents of that file are NEVER committed to the public repo. A
placeholder template with the same structure is committed at
`scripts/whitelabel.secrets.example.json` so anyone cloning the repo
can see the format without learning the actual mappings.

Run from repo root:

    python3 scripts/whitelabel.py
    # or
    npm run whitelabel

Conventions:
- Text-level regex transforms — preserves YAML comments + formatting.
- Longer / more specific patterns FIRST to avoid partial matches (this
  ordering is enforced by the JSON config's array order).
"""

import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
SRC = REPO / "data" / "portfolio.local.yml"
DST = REPO / "data" / "portfolio.yml"
SECRETS = REPO / "scripts" / "whitelabel.secrets.local.json"
EXAMPLE = REPO / "scripts" / "whitelabel.secrets.example.json"


def load_secrets() -> tuple[list[tuple[str, str]], list[str]]:
    """Load (pattern, replacement) pairs + danger-term list from the gitignored
    secrets JSON. Raises a clear error if the file is missing — tells the
    operator how to bootstrap it from the example template.
    """
    if not SECRETS.exists():
        sys.stderr.write(
            f"\nERROR: secrets file not found: {SECRETS.relative_to(REPO)}\n\n"
            f"This file holds the real → anonymized mappings and is intentionally\n"
            f"gitignored so the public repo never reveals the originals.\n\n"
            f"To bootstrap:\n"
            f"    cp {EXAMPLE.relative_to(REPO)} {SECRETS.relative_to(REPO)}\n"
            f"    # then edit it with the actual mappings.\n\n"
        )
        sys.exit(2)

    raw = json.loads(SECRETS.read_text())
    replacements = [(r["pattern"], r["replacement"]) for r in raw.get("replacements", [])]
    danger_terms = list(raw.get("danger_terms", []))
    return replacements, danger_terms


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Master file not found: {SRC}")

    replacements, danger_terms = load_secrets()

    content = SRC.read_text()
    original_len = len(content)

    applied = 0
    for pattern, replacement in replacements:
        new_content, count = re.subn(pattern, replacement, content, flags=re.MULTILINE)
        if count > 0:
            applied += count
            # Print only the COUNT and pattern length, not the pattern itself —
            # otherwise a CI log or shoulder-surfed terminal would leak the
            # mappings. The operator can still grep the local secrets file
            # if they need to audit a specific transform.
            print(f"  · {count}× pattern[{len(pattern)} chars] → replacement[{len(replacement)} chars]")
        content = new_content

    # Safety: warn if any danger term still appears in the anonymized output.
    leftover = []
    for term in danger_terms:
        hits = len(re.findall(rf"\b{re.escape(term)}\b", content))
        if hits > 0:
            leftover.append((term, hits))

    DST.write_text(content)

    new_len = len(content)
    print()
    print(f"Wrote {DST.relative_to(REPO)} ({new_len:,} chars, was {original_len:,})")
    print(f"Total substitutions: {applied}")

    if leftover:
        print()
        print("⚠ DANGER: a danger term still appears in the anonymized output.")
        print("Review the local mappings file and re-run.")
        # Don't echo which term to avoid leaking it; operator can inspect
        # data/portfolio.yml locally.
        raise SystemExit(1)
    else:
        print("✓ No danger terms detected in public output.")


if __name__ == "__main__":
    main()
