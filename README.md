# ResourceBridge

> Technology for Community Stability

ResourceBridge is a bilingual, AI-assisted web platform that helps immigrant and working-class families securely organize, understand, and manage important personal documents — all in one place.

🔗 **Live:** [resourcebridge.tech](https://resourcebridge.tech)

## 🎥 Demo

[Watch Demo Video](https://youtu.be/C0rWYa8_jdQ)

---

## Overview

ResourceBridge bridges the gap between families and the documents that affect their lives. With full English & Spanish support, users can upload any document — immigration paperwork, school records, housing forms, healthcare documents — and instantly receive a plain-language AI summary explaining what it means and what action to take.

Built for real people. Simple, Secure, and Accessible.

---

## Features

- 🌐 **Bilingual Interface** — Full English & Spanish support, toggle anytime
- 🔐 **Secure Authentication** — Email verification, hashed passwords, JWT session tokens
- 🤖 **AI-Powered Summaries** — Google Gemini analyzes uploaded documents and generates plain-language explanations in both English and Spanish
- 📱 **Fully Responsive** — Works seamlessly on any device, optimized for mobile
- 🌙 **Dark Mode** — System-wide dark mode toggle, preference saved across sessions

---

## Functionality

- 📄 **Document Upload & Analysis** — Upload PDFs, images, Word, Excel, and more. AI processes each document instantly at upload time — no re-downloads, no delays
- 🗂️ **Organized Document Vault** — Documents categorized by type (Immigration, School, Housing, Employment, Healthcare, Benefits) with search and filter
- 🚨 **Emergency Packet** — Mark critical documents as emergency and generate a printable packet for your family
- 📧 **Email Reminders** — Set date/time reminders and receive automated emails — never miss a deadline
- ✅ **To-Do List** — Built-in task manager to track action items tied to your documents
- 📚 **Resource Library** — Free bilingual Know Your Rights cards and preparedness checklists covering immigration, housing, employment, healthcare, and school enrollment — no login required
- 🌍 **OCR & Text Extraction** — Extracts text from scanned documents, images, and PDFs

---

## Tech Stack

| Layer    | Tools                                       |
| -------- | ------------------------------------------- |
| Frontend | React, Vite, Tailwind CSS v4, Lucide React  |
| Backend  | FastAPI, PostgreSQL, SQLAlchemy             |
| Auth     | JWT, Bcrypt, Email Verification (Resend)    |
| AI       | Google Gemini 2.5 Flash                     |
| Storage  | Cloudinary                                  |
| Email    | Resend (custom domain: resourcebridge.tech) |
| Hosting  | Render                                      |
| Uptime   | UptimeRobot + self-ping scheduler           |

---

## Project Background

ResourceBridge was built as part of a civic technology internship with the **Chicago Education Advocacy Cooperative (ChiEAC)** — a nonprofit serving immigrant and working-class families in Chicago. The platform was designed, developed, and deployed end-to-end by a single developer over 8 weeks.

---

## Local Development

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

Create a `.env` file in `/backend` with:

```
DATABASE_URL=
GEMINI_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
RESEND_API_KEY=
FROM_EMAIL=noreply@resourcebridge.tech
SECRET_KEY=
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
ALLOWED_ORIGINS=http://localhost:5173
APP_BASE_URL=http://localhost:8000
```

---

© 2026 ResourceBridge — Technology for Community Stability
