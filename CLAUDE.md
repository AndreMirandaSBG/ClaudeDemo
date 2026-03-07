# CLAUDE.md

This file provides guidance for AI assistants (Claude and others) working in this repository.

## Project Status

This is a **newly initialized repository** with no source code yet. This file establishes conventions and workflows to follow as the project is built out.

## Repository Overview

- **Remote**: AndreMirandaSBG/ClaudeDemo
- **Primary development branch**: `claude/claude-md-mmfouyvdon9byt37-QeHJP` (or as specified per task)

## Git Workflow

### Branch Strategy
- Never push directly to `main` or `master` without explicit user permission.
- Feature and task branches should follow the naming pattern: `claude/<short-description>-<session-id>`.
- Always confirm the target branch before pushing.

### Commit Conventions
- Write clear, imperative-style commit messages (e.g., `Add user authentication module`).
- Keep commits focused — one logical change per commit.
- Do not amend published commits; create a new commit instead.

### Push Protocol
```bash
git push -u origin <branch-name>
```
- Retry on network failure with exponential backoff: 2s, 4s, 8s, 16s (max 4 retries).
- Never use `--force` unless explicitly instructed.
- Never skip hooks (`--no-verify`).

## Development Conventions (To Be Updated as Project Grows)

Once source code is added, update this file with:

### Code Style
- Language, linter, and formatter settings (e.g., ESLint, Prettier, Black, rustfmt).
- Naming conventions for files, functions, variables, and classes.
- Import ordering rules.

### Project Structure
- Description of top-level directories and their purpose.
- Location of entry points, configuration, tests, and build output.

### Testing
- How to run tests (e.g., `npm test`, `pytest`, `cargo test`).
- Required test coverage expectations.
- Where test files live relative to source files.

### Building & Running
- How to install dependencies.
- How to run the project locally.
- Environment variable setup (`.env.example` location, required keys).

### CI/CD
- Pipeline configuration location and behavior.
- What must pass before merging (lint, type-check, tests).

## AI Assistant Guidelines

### General
- Read files before modifying them.
- Prefer editing existing files over creating new ones.
- Do not add unnecessary abstractions, helpers, or future-proofing.
- Keep changes minimal and focused on the task at hand.

### Security
- Never commit secrets, tokens, or credentials.
- Validate user input at system boundaries; trust internal code.
- Avoid introducing OWASP Top 10 vulnerabilities (XSS, SQLi, command injection, etc.).

### Risky Actions — Always Confirm First
The following require explicit user confirmation before proceeding:
- Deleting files or branches
- Force-pushing
- Running `git reset --hard` or destructive git operations
- Pushing to `main`/`master`
- Modifying CI/CD pipelines
- Any action visible to other collaborators

### Over-Engineering Avoidance
- Do not add error handling for scenarios that cannot occur.
- Do not create utilities for one-time operations.
- Do not add docstrings, comments, or type annotations to unchanged code.
- Three similar lines of code is better than a premature abstraction.

## Updating This File

This CLAUDE.md should be updated whenever:
- New languages, frameworks, or tools are added to the project.
- Development workflows change.
- New conventions are established.
- Significant architectural decisions are made.
