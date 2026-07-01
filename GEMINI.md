# OpenCode Project Context

OpenCode is an open-source AI coding agent, built as a high-performance alternative to tools like Claude Code. It is provider-agnostic, supporting models from Anthropic, OpenAI, Google (Gemini/Vertex), and others. The project is a monorepo managed with Bun and Turbo.

## 🏗 Architecture & Core Packages

OpenCode is organized as a monorepo under `packages/`:

- **`packages/opencode`**: The main CLI application. Entry point: `src/index.ts`.
- **`packages/core`**: Shared foundational logic, utilities, and common schemas.
- **`packages/llm`**: The core LLM orchestration layer. Uses an Effect-Schema-first design to manage request flows, protocols, and provider routes.
- **`packages/app` / `packages/console`**: Web-based interfaces and dashboards (built with SolidJS).
- **`packages/desktop`**: Electron-based desktop application.
- **`packages/ui`**: Shared UI components, specifically for the Terminal User Interface (TUI).
- **`infra/`**: Infrastructure configuration using SST (v3).

## 🛠 Tech Stack

- **Runtime**: [Bun](https://bun.sh/) (v1.3.13+)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (v5.8.2)
- **State & Logic**: [Effect](https://effect.website/) (v4.0.0-beta.65) - Used extensively for functional programming and error handling.
- **Frontend/TUI**: [SolidJS](https://www.solidjs.com/) & [OpenTUI](https://github.com/opentui/opentui) - High-performance terminal and web UIs.
- **Database**: [Drizzle ORM](https://orm.drizzle.team/) with SQLite (via Bun's native driver).
- **Environment**: [Nix](https://nixos.org/) - Used for reproducible dev environments (`flake.nix`).

## 💻 Development Workflow

### Key Commands

| Task | Command |
| :--- | :--- |
| **Install Dependencies** | `bun install` |
| **Run CLI (Dev Mode)** | `bun run dev` (runs `packages/opencode`) |
| **Typecheck** | `bun run typecheck` (via Turbo) |
| **Lint** | `bun run lint` (via `oxlint`) |
| **Build** | `bun run build` |
| **Run Web App** | `bun run dev:web` |
| **Run Console** | `bun run dev:console` |

> [!NOTE]
> Do not run tests from the root. Run `bun test` within specific package directories.

### Development Environment

The project uses Nix for its development environment. If you have Nix installed with flakes enabled:
```bash
nix develop
# or if using direnv
direnv allow
```

## 📜 Coding Conventions

### Functional Programming with Effect
A significant portion of the codebase, especially in `packages/core` and `packages/llm`, follows `Effect` patterns:
- Use `Stream.Stream` for streaming data.
- Use `Effect.gen` for generator-based async logic.
- Prefer yielding yieldable errors (`return yield* new MyError(...)`) over `Effect.fail`.
- Use Effect Schema for JSON encoding/decoding.

### LLM Implementation (`packages/llm`)
- **Request Flow**: `LLMRequest` -> `LLMClient.generate` / `LLMClient.stream`.
- **Routes**: Composed of `Protocol` (API contract), `Endpoint` (path), `Auth` (transport auth), and `Framing` (bytes -> frames).
- **Providers**: New providers are typically added by registering a new `Route` that reuses existing protocols (e.g., many providers reuse `OpenAIChat.protocol`).

### UI & TUI
The terminal interface uses a custom SolidJS renderer (`OpenTUI`). Styles and layouts are managed similarly to web components but optimized for the terminal.

## 📂 Key Files & Directories

- `package.json`: Root configuration and workspace definitions.
- `turbo.json`: Monorepo task pipeline configuration.
- `packages/opencode/src/index.ts`: CLI entry point and command registrations.
- `packages/llm/src/schema/`: Canonical LLM data models.
- `packages/llm/AGENTS.md`: Deep dive into LLM package architecture.
- `infra/app.ts`: Entry point for SST infrastructure.
- `.opencode/`: CLI-specific configurations and plugins.
