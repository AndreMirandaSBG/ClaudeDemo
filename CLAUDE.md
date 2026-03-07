# CLAUDE.md

Guidelines for Claude Code when working on this repository.

## Tech Stack

- **Framework**: React 19 with TypeScript
- **Build tool**: Vite 7
- **Hosting**: Firebase Hosting
- **Linting**: ESLint 9 with typescript-eslint and react-hooks plugins
- **Package manager**: npm

### Project Structure

```
src/
  components/   # React UI components
  hooks/        # Custom React hooks (business logic)
  types/        # TypeScript type definitions
  index.css     # Global styles
  main.tsx      # App entry point
  App.tsx       # Root component
```

Keep business logic in hooks, UI in components, and shared types in types/.

## Coding Style & Conventions

- Use **named exports** for components and hooks; default export only for `App`
- One component or hook per file; filename matches the exported name
- Use **functional components** only — no class components
- Prefer `const` arrow functions for component definitions
- Use TypeScript strictly — no `any`, no implicit types
- Use interfaces for object shapes in `types/`; inline types for local/simple cases
- CSS is plain CSS in `index.css` — no CSS modules or styled-components
- Keep components presentational where possible; put logic in custom hooks

## Branch Naming

All Claude-created branches must follow this pattern:

```
claude/<description>/<session-id>
```

Example: `claude/add-history-feature/session_01Jznku1xD1uqp9UvSWeyf6K`

- Never commit directly to `main`
- Always open a PR from a `claude/` branch into `main`

## Commit Message Format

Use the imperative mood, present tense:

```
<type>: <short summary>

[optional body]
```

**Types**: `feat`, `fix`, `refactor`, `style`, `chore`, `docs`, `test`

Examples:
```
feat: add keyboard input support to calculator
fix: correct division by zero handling
chore: update firebase deploy config
```

- Keep the summary under 72 characters
- No period at the end of the summary line
- Reference issues or sessions in the body when relevant
