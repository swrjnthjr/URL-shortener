# Node.js Project Rules for Claude

## Tech Stack & Environment
- **Node.js**: v20.12 LTS (Do not use features beyond this version)
- **Runtime**: CommonJS only (`require`/`module.exports`) — DO NOT use ESM (`import`/`export`) unless explicitly told or working in a `.mjs` file.
- **Language**: Vanilla JavaScript (ES6+). Do not write or compile TypeScript unless requested.
- **Framework**: Express.js v4.19.2 (CRITICAL: Express 4 does not natively catch async errors).

## Project Structure & Architecture
- Code must follow this strict directory layout:
  - `src/routes/`      -> Defines paths and wires middleware. No business logic.
  - `src/controllers/` -> Handles req/res lifecycles, maps inputs, and calls services.
  - `src/services/`    -> Pure business logic. Framework-agnostic (NEVER import Express or reference req/res here).
  - `src/middleware/`  -> Authentication, validation, and global interceptors.
  - `src/lib/`         -> Utility functions and third-party wrappers.

## Code Style & Guardrails
- **Variables**: Always prefer `const` over `let`. Never use `var`.
- **Asynchronous Execution**: Always use `async/await`. Never mix promise chains (`.then().catch()`) with callback patterns in the same module.
- **Callback Conversions**: If a third-party library relies on callbacks, wrap it using `util.promisify` immediately.
- **File Length**: Keep helper scripts and middleware modules under 200 lines. Extract sub-logic into `src/lib/`.

## Error Handling & Middleware Chains
- **Async Routes**: Every asynchronous route handler/controller MUST wrap its execution block inside a `try/catch` block.
- **Next Error Propagation**: All caught errors in controllers must be explicitly passed downstream using `next(err)`. Never swallow errors or handle raw 500 responses inside a service.
- **Centralized Handler**: Global exceptions must funnel exclusively into the centralized error-handling middleware mounted last in `server.js` via `app.use((err, req, res, next) => {})`.

## Development Commands
- **Install Dependencies**: `npm install`
- **Start Production**: `npm start`
- **Start Development**: `npm run dev` (Runs via nodemon)
- **Run Tests**: `npm test`