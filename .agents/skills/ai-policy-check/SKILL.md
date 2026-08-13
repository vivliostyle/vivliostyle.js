---
name: ai-policy-check
description: Check compliance with AI_POLICY.md when creating a git commit or a pull request in this repository.
---

# AI Policy compliance check

For commits and pull requests that contain AI-generated changes (see `AI_POLICY.md` at
the repository root):

- **Commit**: the message ends with `Assisted-by: AGENT_NAME:MODEL_VERSION`, naming the
  exact model used, e.g. `Assisted-by: GitHub Copilot Chat:gpt-5.6-luna`. No
  `Co-authored-by:` trailer naming an AI.
- **PR body**: contains the same `Assisted-by:` line, and a short description of the
  human/AI division of labor inside a `<details><summary>How the AI was used</summary>`
  block (see the example in `AI_POLICY.md`).

Fix anything that does not match before pushing or opening the PR.
