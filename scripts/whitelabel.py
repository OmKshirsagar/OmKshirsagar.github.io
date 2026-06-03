#!/usr/bin/env python3
"""
Whitelabel transform: reads data/portfolio.local.yml (master, real names)
and writes data/portfolio.yml (anonymized, safe-to-commit).

Run from repo root:
    python3 scripts/whitelabel.py

Conventions:
- Text-level regex transforms — preserves YAML comments + formatting.
- Longer / more specific patterns FIRST to avoid partial matches.
- IDs use domain-prefix + use-case-suffix naming (pharma-*, healthcare-*).
"""

import re
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
SRC = REPO / "data" / "portfolio.local.yml"
DST = REPO / "data" / "portfolio.yml"


# ---------------------------------------------------------------------------
# Transformations applied in order. (pattern, replacement, flags?)
# Order matters: more-specific first to prevent partial overwrites.
# ---------------------------------------------------------------------------

REPLACEMENTS = [
    # =========================================================================
    # 1. CODE-NAME / BRAND REMOVAL (most specific first)
    # =========================================================================

    # "REDACTED-CODENAME" code name — drop everywhere (with optional surrounding
    # punctuation/parens)
    (r" \(REDACTED-CODENAME\)", ""),
    (r"\(REDACTED-CODENAME\)", ""),
    (r"REDACTED-CODENAME — internal Deloitte engineering program", "internal AI engineering program"),
    (r"REDACTED-CODENAME", "internal engineering program"),

    # REDACTED-PRODUCT (client product) — replace with generic
    (r"REDACTED-PRODUCT", "the client's flagship product"),
    (r"redacted-product-knowledge", "product-knowledge-index"),
    (r"search_redacted-product_info", "search_product_info"),

    # REDACTED-PERSONA (agent persona) — generalize
    (r'name: REDACTED-PERSONA', 'name: Assistant'),
    (r'"REDACTED-PERSONA"', '"Assistant"'),
    (r"REDACTED-PERSONA", "the assistant"),

    # Romania (specific Databricks engineer location) — generalize
    (r"Databricks Engineer \(Romania\)", "Databricks Engineer (external collaborator)"),
    (r"in Romania", "(external collaborator)"),

    # =========================================================================
    # 2. CLIENT DISPLAY NAMES (industry-descriptive)
    # =========================================================================

    # REDACTED-CLIENT-A → "Global pharmaceutical manufacturer"
    (r"REDACTED-CLIENT-A was", "The pharmaceutical client was"),
    (r"REDACTED-CLIENT-A's", "the pharmaceutical client's"),
    (r"REDACTED-CLIENT-A", "Global pharmaceutical manufacturer"),

    # REDACTED-CLIENT-B → "US healthcare diagnostics provider"
    (r"REDACTED-CLIENT-B", "US healthcare diagnostics provider"),

    # =========================================================================
    # 3. IDENTIFIERS / IDs / REFs
    # =========================================================================

    # Engagement IDs and refs
    (r"engagement_ref: redacted-client-a$", "engagement_ref: pharma-client"),
    (r"engagement_ref: redacted-client-a\b", "engagement_ref: pharma-client"),
    (r"engagement_ref: redacted-client-b$", "engagement_ref: healthcare-client"),
    (r"engagement_ref: redacted-client-b\b", "engagement_ref: healthcare-client"),
    (r"- id: redacted-client-a$", "- id: pharma-client"),
    (r"- id: redacted-client-b$", "- id: healthcare-client"),

    # Project IDs — longest replacements first
    (r"redacted-client-a-insight-center", "pharma-workflow-platform"),
    (r"redacted-client-a-nmt", "pharma-supply-chain-modeling"),
    (r"exact-rtva", "healthcare-voice-assistant"),
    (r"exact-rcm", "healthcare-policy-platform"),

    # Bare `redacted-client-a` / `redacted-client-b` strings in arrays / phase refs
    (r"phase: REDACTED-CLIENT-A\b", "phase: Pharma Client"),
    (r"phase: REDACTED-CLIENT-B\b", "phase: Healthcare Client"),
    (r"name: REDACTED-CLIENT-A$", "name: Pharma Client"),
    (r"name: REDACTED-CLIENT-A\b", "name: Pharma Client"),
    (r"name: REDACTED-CLIENT-B$", "name: Healthcare Client"),
    (r"name: REDACTED-CLIENT-B\b", "name: Healthcare Client"),

    # =========================================================================
    # 4. SECTION HEADER COMMENTS (cosmetic, keep human-readable)
    # =========================================================================

    (r"# REDACTED-CLIENT-A  \(client\)", "# PHARMA CLIENT"),
    (r"# REDACTED-CLIENT-B  \(client\)", "# HEALTHCARE CLIENT"),
    (r"# REDACTED-CLIENT-A  \(client · Apr 2024 – Nov 2024\)", "# PHARMA CLIENT  (Apr 2024 – Nov 2024)"),
    (r"# REDACTED-CLIENT-B  \(client · Aug 2025 – present\)", "# HEALTHCARE CLIENT  (Aug 2025 – present)"),
    (r"# SOP PROGRAM  \(internal Deloitte program · Oct 2024 – Aug 2025\)",
     "# SOP PROGRAM  (internal AI engineering program · Oct 2024 – Aug 2025)"),

    # =========================================================================
    # 5. AWARD CONTEXT STRINGS  (already partially-anonymized by earlier rules,
    # this is a final pass for safety)
    # =========================================================================

    # Already handled by REDACTED-CLIENT-A → "Global pharmaceutical manufacturer", etc.
    # But fix the NMT capitalization context
    (r"Global pharmaceutical manufacturer NMT", "the pharmaceutical client's NMT"),
    (r"Global pharmaceutical manufacturer's NMT", "the pharmaceutical client's NMT"),

    # =========================================================================
    # 6. PRE-LINE WARNING BANNER
    # =========================================================================

    (r"# Single source of truth for omkshirsagar\.github\.io",
     "# ⚠ ANONYMIZED PUBLIC VERSION\n# Generated by scripts/whitelabel.py from data/portfolio.local.yml.\n# Edit the .local file (gitignored), then re-run the script. DO NOT edit this file directly.\n# Single source of truth for omkshirsagar.github.io"),
]


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Master file not found: {SRC}")

    content = SRC.read_text()
    original_len = len(content)

    applied = 0
    for pattern, replacement in REPLACEMENTS:
        new_content, count = re.subn(pattern, replacement, content, flags=re.MULTILINE)
        if count > 0:
            applied += count
            print(f"  · {count}× {pattern!r:60} → {replacement!r}")
        content = new_content

    # Safety: warn if any "real" client name remains
    danger_terms = ["REDACTED-CLIENT-A", "REDACTED-CLIENT-B", "REDACTED-PRODUCT", "REDACTED-PERSONA"]
    leftover = []
    for term in danger_terms:
        # Allow inside the new ID 'pharma-supply-chain-modeling-tool' etc.; skip
        # check inside our own anonymized replacements.
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
        print("⚠ DANGER: real client names still present in output:")
        for term, count in leftover:
            print(f"    {term}: {count} occurrence(s)")
        print("Review the output and update REPLACEMENTS in this script.")
        raise SystemExit(1)
    else:
        print("✓ No real client names detected in public output.")


if __name__ == "__main__":
    main()
