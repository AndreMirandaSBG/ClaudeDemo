# CLAUDE.md

Guidance for AI assistants working in this repository.

## Project Overview

- **Repo**: AndreMirandaSBG/ClaudeDemo
- **Status**: Newly initialized — no source code yet
- **Active branch**: `claude/claude-md-mmfouyvdon9byt37-QeHJP`

---

## Git Workflow

### Branches
- Do **not** push to `main` or `master` without explicit user permission.
- Task branches follow the pattern: `claude/<description>-<session-id>`.
- Confirm the target branch before every push.

### Commits
- Imperative-style messages: `Add login endpoint`, `Fix null check in parser`.
- One logical change per commit.
- Never amend published commits — always create a new one.

### Pushing
```bash
git push -u origin <branch-name>
```
- On network failure, retry up to 4 times: wait 2s, 4s, 8s, 16s between attempts.
- Never `--force` push unless explicitly told to.
- Never `--no-verify`.

---

## AI Assistant Rules

### Before Making Changes
1. Read every file you intend to modify.
2. Understand the existing code before suggesting or applying changes.
3. Prefer editing existing files over creating new ones.

### Scope
- Make only the changes asked for — nothing more.
- Do not refactor surrounding code, add comments, or improve unrelated areas.
- Do not add abstractions, helpers, or utilities unless they are directly required.
- Do not future-proof. Write for the current requirement.

### Code Quality
- No error handling for impossible scenarios.
- No docstrings, type annotations, or comments on code you didn't change.
- Three duplicated lines beat one premature abstraction.

### Security
- Never commit secrets, tokens, API keys, or credentials.
- Validate at system boundaries (user input, external APIs); trust internal code.
- Avoid OWASP Top 10 issues: XSS, SQL injection, command injection, etc.

### Require User Confirmation Before
- Deleting files or branches
- Force-pushing
- `git reset --hard` or any destructive git operation
- Pushing to `main` or `master`
- Modifying CI/CD pipelines
- Any action visible to other collaborators (comments, PR changes, etc.)

---

## Sections to Complete as the Project Grows

When source code is added, fill in the following:

### Language & Tooling
> _Add language version, runtime, package manager, linter, formatter._

### Project Structure
> _Describe top-level directories, entry points, config location, build output._

### Running Locally
```bash
# Add install and run commands here
```

### Testing
```bash
# Add test commands here
```
> _Note test file locations and coverage expectations._

### Environment Variables
> _List required env vars and point to `.env.example`._

### CI/CD
> _Describe pipeline location and what must pass before merging._

---

## Keeping This File Current

Update CLAUDE.md when:
- A language, framework, or tool is added or removed.
- A workflow or convention changes.
- A significant architectural decision is made.
