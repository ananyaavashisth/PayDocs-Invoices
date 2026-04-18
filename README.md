# PayDocs — Invoice Generator

A modern, robust invoice generator built with a focus on **Simplicity, Correctness, and Interface Safety**.

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python seed_db.py  # Populate with test business/clients
python app.py      # Starts on http://localhost:5001
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev        # Starts on http://localhost:5173
```

## 🛠 Tech Stack
- **Backend:** Python, Flask, SQLAlchemy (SQLite), Pydantic
- **Frontend:** React, TypeScript, Vite, Tailwind CSS v4, Lucide React
- **Validation:** Pydantic (Strict API boundary)
- **PDFs:** Frontend browser-based printing (styled with `@media print`)

## 🏗 Key Engineering Decisions
- **Financial Integrity**: All monetary values (`unit_price`, `total_amount`) are stored as **integers (cents)** to eliminate floating-point precision errors—this is critical for financial software.
- **Interface Safety**: The API uses strict Pydantic schemas for all boundaries. It never trusts client-side math; it re-validates and re-calculates all totals server-side within a single transaction.
- **Automatic Status Tracking**: Invoices dynamically calculate an "Overdue" state if they are unpaid and pass their `due_date`, ensuring the Dashboard is always accurate without manual updates.
- **Absolute Path Persistence**: Fixed common SQLite ambiguity issues by enforcing absolute DB path resolution, ensuring the backend worker and seed scripts always target the same data file.
- **Responsive Premium UI**: Built with a "Paper-First" design philosophy using Tailwind CSS v4 and custom glassmorphism effects for a high-end B2B feel.

## 📁 Project Structure
- `/backend`: Flask application, SQLAlchemy models, and Pydantic schemas.
- `/frontend`: React application with structured `api`, `components`, `pages`, and `types` directories.

## ✅ Submission Checklist
1. **GitHub Link**: Ensure all code (including this README) is pushed.
2. **Seeded Data**: Run `python seed_db.py` in the backend before submitting so your dashboard isn't empty!
