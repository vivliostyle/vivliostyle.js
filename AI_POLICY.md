# Generative AI Policy

This policy applies to the projects managed by the
[Vivliostyle organization](https://github.com/vivliostyle). Several of these
projects are developed with the support of NLnet Foundation grants and adhere
to NLnet's
[policy on the use of generative AI](https://nlnet.nl/foundation/policies/generativeAI/).
This document is the public disclosure of our stance on generative AI use that
the policy asks funded projects to provide.

## Our stance

We use generative AI tools in the development of our projects, and we disclose
that use openly. AI is a tool that assists human developers. It does not
replace human judgment or responsibility. A human maintainer designs, reviews,
and verifies every change before it is merged. The human committer is fully
responsible for the correctness, quality, and licensing of all submitted work,
whether or not AI tools were used.

## Tools we use

- Generative AI coding assistants (e.g. "Claude Code", and other AI coding
  agents): writing and refactoring code, writing tests, debugging,
  documentation, and translation. The specific tool and model are recorded
  per commit (see below).
- GitHub Copilot: code review suggestions and automated fixes (Copilot
  Autofix).

The set of tools varies by project and changes over time. The disclosure rules
below apply to whichever generative AI tool is used. Some projects also use
conventional machine translation (e.g. Google Cloud Translation) for
localization. This is not generative AI, and humans review the translations
before release.

## Per-commit disclosure

Commits that contain AI-generated code carry a trailer naming the tool and the
specific model used. The preferred format is the `Assisted-by:` trailer
[adopted by the Linux kernel](https://www.kernel.org/doc/html/latest/process/coding-assistants.html).
It names the agent and the exact model version:

```
Assisted-by: Claude Code:claude-fable-5
```

We prefer this over `Co-authored-by:` because authorship, with the rights and
responsibilities that come with it, stays with the human committer. The AI is
a tool that assists. Trailers added automatically by tools, such as
`Co-authored-by: Copilot <copilot@github.com>`, are also accepted as
disclosure. Contributors do not need to reconfigure their tools.

We do not put full prompt transcripts in commit messages. Instead, we describe
the collaboration in the pull request: what was delegated to the AI, and what
the human contributor designed, decided, reviewed, and verified. This shows
the human design and review behind each change better than raw prompt logs
would.

The pull request body also carries the `Assisted-by:` line. Because the
collaboration description tends to be long, wrap it in a `<details>` block so
the body stays readable. For example:

```markdown
Fixes the print preview failing to load on Safari.

Assisted-by: Claude Code:claude-fable-5

<details>
<summary>How the AI was used</summary>

- The human author identified the bug from a user report, chose to fix it in
  the service worker rather than the viewer, and required that the response
  headers stay unchanged.
- The AI located the failing code path, drafted the fix, and wrote a
  regression test.
- The human author reviewed the diff, simplified the error handling, and
  verified the fix in Safari and Chrome before requesting review.

</details>
```

## Human responsibility

- A human maintainer reviews all AI-assisted changes before merge.
- AI output is verified by building, type-checking, linting, and testing, and
  by manual checks in the running software where relevant.
- Polished-looking output is not a substitute for understanding. The committer
  must be able to explain every change in review.

## Copyright and licensing

- Do not submit AI output that reproduces third-party copyrighted material.
  Take extra care with output that is likely to resemble existing, well-known
  code.
- Purely AI-generated work with no meaningful human involvement is not
  accepted.
- All contributions must be publishable under a recognized free/open-source
  license.

## Contributions from others

We welcome contributions, with or without AI assistance:

- If you made substantive use of generative AI, say so in your pull request
  description: which tool and model, and what you used it for. Add the trailer
  described above to AI-assisted commits.
- Write pull request descriptions and issue reports yourself. Clearly mark any
  text written by an LLM.
- You must understand the code you submit and be able to discuss it in review.

## Review of this policy

We review this policy whenever NLnet updates its generative AI policy, and as
the generative AI landscape changes. Questions are welcome on the issue
tracker of each project.
