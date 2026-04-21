# Flux Talent ATS (Digital Curator)

## 🚀 Live Demo
**Render URL:https://flux-talent-ats.onrender.com/login

---

## 🎯 What Problem Does This Solve?
Flux Talent ATS is a **premium, AI‑enhanced applicant tracking system** that automates the entire hiring pipeline:
- **Capacity‑aware job postings** – only a configurable number of active candidates are shown.
- **Automatic promotion** – when a slot opens, the next wait‑listed applicant is promoted instantly.
- **Inactivity decay** – idle candidates are demoted after a configurable timeout.
- **Full audit trail** – every state transition is logged for compliance and analytics.
- **Antigravity‑ready** – built and tested inside the Antigravity IDE, leveraging its AI‑assisted development workflow.

---

## 📸 Screenshots & Demo
![Login Page](C:\Users\heman\.gemini\antigravity\brain\12cbb08f-f350-49ee-9e35-dcf012945e6b\click_feedback_1776753580461.png)

<details>
  <summary>🖥️ Full UI Walkthrough (click to expand)</summary>
  
  ![UI Walkthrough](C:\Users\heman\.gemini\antigravity\brain\12cbb08f-f350-49ee-9e35-dcf012945e6b\final_fixed_ui_walkthrough_1776753853222.webp)
</details>

---

## 🛠️ Tech Stack
![HTML5](https://img.shields.io/badge/HTML5-%23E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-%231572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-%23F7DF1E?style=flat&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=flat&logo=postgresql&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Antigravity IDE](https://img.shields.io/badge/Antigravity-FF6F61?style=flat&logo=google&logoColor=white)

---

## 📦 Installation & Setup (Local Development)
```bash
# 1️⃣ Clone the repo
git clone https://github.com/hemanth021-cmyk/ATS-pipeline.git
cd ATS-pipeline

# 2️⃣ Install backend dependencies
cd backend
npm install

# 3️⃣ Install frontend dependencies
cd ../frontend
npm install

# 4️⃣ Create a .env file (copy from .env.example) and set your PostgreSQL URL
cp .env.example .env
# Edit .env → set DATABASE_URL, JWT_SECRET, etc.

# 5️⃣ Run the database migrations (if any) – you can use any tool you prefer.
# Example with psql:
psql $DATABASE_URL < ./db/schema.sql

# 6️⃣ Start the backend (in one terminal)
cd ../backend
npm start   # runs src/index.js on port 3000

# 7️⃣ Start the frontend dev server (in another terminal)
cd ../frontend
npm run dev   # runs Vite on port 5174 (proxy → backend)
```
Open `http://localhost:5174` in your browser – you should see the polished login screen.

---

## 🧪 Running Tests
```bash
# Backend tests (Jest)
cd backend && npm test

# Frontend tests (Vitest)
cd ../frontend && npm run test
```
All tests pass in CI.

---

## 🛠️ Development Environment
- **Antigravity IDE** – the project was built using the Antigravity AI‑assisted IDE, which provides real‑time code suggestions, linting, and automated refactoring.
- **TailwindCSS** – custom design tokens are defined in `frontend/src/design-system.css` and are consumed via Tailwind utilities for a **glassmorphism** look.
- **Vite Proxy** – `vite.config.js` forwards `/api` and `/health` calls to the Express backend (`localhost:3000`).

---

## 🤝 Contributing
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/awesome‑feature`).
3. Follow the existing code style (ESLint + Prettier).
4. Submit a Pull Request with a clear description of the change.

---

## 📄 License
MIT License – see the `LICENSE` file for details.

---

## 📌 Repository Metadata (GitHub Sidebar)
- **About:** Flux Talent ATS – AI‑enhanced hiring pipeline with auto‑promotion and decay.
- **Topics:** `web-development`, `react`, `nodejs`, `postgresql`, `antigravity-ide`, `tailwindcss`, `ats`.
- **Social Preview:** Upload a custom image (e.g., the login screenshot) via *Settings → General* for a professional link preview.

---

*Built with love, AI, and a dash of design magic.*
