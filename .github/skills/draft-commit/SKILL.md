---
name: draft-commit
description: "Draft a conventional commit message in Markdown from the current changes. Use when: writing a commit message proposal, summarizing staged or unstaged changes, preparing a changelog-friendly commit title, or drafting a message for a GitHub issue fix. Produces text only and never runs git commit."
argument-hint: "Optional context such as target issue, desired type, scope preference, or summary of the intended change"
---

# Draft a Commit Message

Draft a commit message proposal in Markdown based on the current changes or the context provided by the user. Produce text only. Do not run `git commit`, do not amend commits, and do not change git state.

## When to Use

- Draft a commit message for the current working tree.
- Turn a code change into a release-note-friendly summary.
- Prepare a commit message for a GitHub issue fix.
- Refine an existing rough commit title or body.

## Output Requirements

- Return the draft as Markdown.
- Put the full commit message in a fenced code block so the user can review it easily.
- Do not execute `git commit` or any other git write operation.
- If the available information is incomplete, state the assumptions briefly before the code block.
- When the draft mentions program names, commands, file paths, code identifiers, or HTML/CSS syntax, use inline backticks appropriately.

## Title Rules

- Start the title with a conventional commit type such as `fix:`, `feat:`, `docs:`, `refactor:`, `test:`, or `chore:`.
- For changes in `packages/core`, use the plain type prefix without a scope, such as `fix:` or `feat:`.
- For changes centered on packages other than core, include that package as the scope, such as `fix(viewer):` or `feat(react):`.
- After the type prefix, start the description with an uppercase letter.
- Make the title explain what bug was fixed or what feature was implemented.
- Prefer wording that is clear in release notes or changelogs.
- Keep the title specific to the user-visible outcome, not just the internal implementation detail.

Examples:

- `fix: Fix WPT test failures for embedded HTML content`
- `fix(viewer): Fix page navigation state sync`
- `feat: Add support for semantic footnote call markers`

## Body Rules

- Explain what was changed and how it was implemented.
- Focus on the main behavior change, root cause, or implementation approach.
- Keep the body concise but informative.
- If there is a related issue or PR that is not closed by the commit, include an appropriate reference such as `Refs #1914`, `Related to #1914`, or `See PR #1234`.
- If the change resolves a GitHub issue, end the body with `Closes #1914` using the relevant issue number.

## Procedure

1. Gather context from the user's prompt and, when needed, inspect the current git changes with read-only commands or tools.
2. Infer the best conventional commit type from the nature of the change.
3. Identify the user-visible fix or feature and express that in the title.
4. Summarize the key implementation details in the body.
5. If the work resolves a GitHub issue, append a final line like `Closes #1914`. Otherwise, add a related issue or PR reference when that context is relevant.
6. Return only the draft and any brief assumptions needed for review.

## Decision Rules

- Use `fix:` for bug fixes, regressions, compatibility fixes, or test-failure fixes tied to broken behavior.
- Use `feat:` for new behavior or newly supported capability.
- Use `refactor:` when behavior is unchanged but the implementation is meaningfully reworked.
- Use `docs:`, `test:`, or `chore:` only when the change is primarily documentation, tests, or maintenance.
- If the change spans multiple categories, choose the type that best matches the main user-facing outcome.
- If the change is mainly in `packages/viewer` or `packages/react`, include that package name as the scope.
- If the change is mainly in `packages/core`, omit the scope.

## Quality Check

Before returning the draft, verify that:

- The title begins with a valid conventional prefix.
- The first word after the prefix starts with an uppercase letter.
- The title states the fix or feature clearly enough for release notes.
- The body explains the actual change rather than repeating the title.
- Related issues or PRs are referenced when useful, and `Closes #...` is used only when the commit actually closes the issue.
- Program names, commands, code identifiers, and HTML/CSS terms are wrapped in inline backticks where appropriate.
- The issue-closing line is present only when the change actually closes a GitHub issue.
- The response contains a draft only and does not perform `git commit`.
