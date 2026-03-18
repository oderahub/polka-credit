# AI Constraints

## Read-first contract
Before any planning, implementation, or verification, read:
1. docs/SPEC.md
2. docs/PRD_TRACK2_V2.md
3. docs/ARCHITECTURE.md
4. docs/SYSTEM_MAP.md
5. docs/AI_CONSTRAINTS.md

For non-trivial UI work, also read:
6. docs/UI_XML_WORKFLOW.md

## Core rules
- Prefer updating docs and constraints over patching symptoms repeatedly.
- Respect module boundaries.
- Do not introduce new dependencies unless the spec explicitly allows it.
- Prefer deterministic verification over visual guessing.
- Surface blockers clearly instead of looping indefinitely.
- Do not silently change architecture.
- Do not weaken validation or security checks.
- Keep native Polkadot capability visible in implementation and demo design.
- Do not rely on PolkaVM stretch work as the only proof of native differentiation.

## Mandatory loop
edit → verify → inspect output → fix → repeat

## Completion rule
Work is done only when verification passes and docs match implementation.
