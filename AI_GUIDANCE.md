# AI Guidance & Engineering Standards

This document outlines the prompting strategies, technical constraints, and coding standards used to guide AI agents during the development of PayDocs.

## 1. Agent Persona & Knowledge Profile
The AI agent was configured with a **Senior Full-Stack Engineer** persona, emphasizing:
- **Financial Accuracy**: A bias toward correctness over speed.
- **Architectural Stability**: Preferring robust, long-term solutions (like absolute paths) over "quick fixes."
- **Code Completeness**: Instructions to avoid truncated snippets and ensuring all imports and dependencies are maintained during edits.

## 2. Prompting Strategies & Workflow
These "rules of engagement" ensured high-quality, iterative progress:
- **Research-First Protocol**: Before any code modification using a "Research Phase" to analyze existing database schemas or API client configurations.
- **Critical Audits**: Periodic requests for the agent to "critically audit" its own work for edge cases (e.g., verifying the dynamic 'Overdue' logic across multiple pages).
- **Verification Loop**: After every backend change, verifying the API behavior using industrial tools like `curl` before moving to frontend integration.

## 3. Technical Constraints (Shun-List)
The following hard constraints were enforced on the AI to maintain system integrity:
- **No Float for Money**: Strictly prohibited `float` or `decimal` for currency. All monetary data must be stored and transmitted as **integers (cents/basis points)**.
- **Port Management**: The backend is constrained to **Port 5001** to prevent conflicts with macOS AirPlay (which occupies Port 5000).
- **Zero-Trust Backend**: The backend is prohibited from trusting frontend calculations. It must re-validate and re-calculate all totals within a server-side transaction.
- **Absolute Persistence**: SQLite paths must be resolved as **absolute file paths** to ensure consistency between the web server and independent seed scripts.

## 4. Coding Standards & Style
To ensure a cohesive, professional codebase, the following standards were applied:
- **Type Safety**: Mandatory use of TypeScript (React) and Pydantic (Flask) to ensure type parity across the stack.
- **Centralized API Client**: All frontend-to-backend communication must happen through a single, configured `apiClient` (Axios) to maintain unified timeouts and headers.
- **Premium Design Tokens**: Styling must strictly adhere to **Tailwind CSS v4**, utilizing custom HSL color palettes and professional glassmorphism effects for a high-end B2B aesthetic.
- **Semantic HTML**: Mandatory use of Semantic HTML5 tags (e.g., `<section>`, `<header>`, `<main>`) to ensure accessibility and professional structure.
