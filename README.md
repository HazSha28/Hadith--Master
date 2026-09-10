# 🕌 Hadith Master


> Explore 30,000+ authentic hadiths from the six canonical books — with AI-powered search, voice input, community chat, and a personalized learning dashboard.A comprehensive digital platform for studying, searching, and engaging with authentic Islamic Hadith literature — with modern AI-powered tools.


[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%7C%20Auth-FFCA28?logo=firebase)](https://firebase.google.com)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Full--text%20Search-4169E1?logo=postgresql)](https://postgresql.org)

---

## 📖 Overview

Hadith Master makes the sayings and teachings of Prophet Muhammad ﷺ accessible to everyone. It provides a searchable database of **40,000+ authentic hadiths** from the six canonical collections (Kutub al-Sittah), with AI-powered search, community chat, and a real-time user dashboard.

---

## ✨ Features

### 📚 Hadith Collections
| Book | Hadiths | Grade |
|---|---|---|
| Sahih al-Bukhari | 6,999 | Most Authentic |
| Sahih Muslim | 5,234 | Most Authentic |
| Sunan an-Nasai | 5,662 | Good (Hasan) |
| Sunan Abu Dawud | 4,588 | Good (Hasan) |
| Jami at-Tirmidhi | 3,891 | Good (Hasan) |
| Sunan Ibn Majah | 4,329 | Good (Hasan) |

### 🔍 Search
- **AI Search** — Gemini extracts keywords from natural language, Groq generates answers
- **Full-text search** — PostgreSQL GIN indexes on both English and Arabic text
- **Voice search** — Web Speech API, no backend needed
- **Image upload** — OCR (OCR.space) reads English text from images and searches

### 💬 Community
- **Community Chat** — real-time group chat with emoji reactions (👍 ❤️ 😄 🤲)
- **Admin Support** — private user ↔ admin threads, real-time inbox in admin panel
- **Message reactions** — toggle reactions, stored in Firestore

### 👤 User Profile
- Real-time stats: Hadiths Read, Study Streak, Liked, Study Time
- Achievement badges (First Hadith, Scholar, Devoted, etc.)
- Goal progress bars
- Saved hadiths, activity timeline
- Avatar upload

### 🛡️ Admin Panel
- User management (approve, reject, suspend)
- Comment moderation
- Community chat moderation (delete any message)
- Support inbox — reply to user private messages in real-time

---

## 🏗️ Architecture

┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND — REACT                        │
│                                                             │
│        Vite + TypeScript + TailwindCSS + shadcn/ui          │
│                     Port: 8080                              │
│                                                             │
│              /api → Proxy to localhost:3002                 │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               │ API Requests
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND — NODE.JS                        │
│                                                             │
│                  Express + PostgreSQL (pg)                  │
│                       Port: 3002                            │
└───────────────┬───────────────────────────┬─────────────────┘
                │                           │
                │ Database Queries          │ Firebase Services
                ▼                           ▼
┌──────────────────────────┐     ┌────────────────────────────┐
│       POSTGRESQL         │     │       FIREBASE (GOOGLE)    │
│                          │     │                            │
│  • 30K+ Hadith Records   │     │  • Firestore               │
│  • Full-Text Search      │     │  • Authentication          │
│  • GIN Indexes           │     │  • Cloud Storage           │
│  • Structured Data       │     │  • Security Rules          │
└──────────────────────────┘     └────────────────────────────┘


**What goes where:**
- **PostgreSQL** — all hadith data (text, Arabic, metadata, full-text search)
- **Firestore** — user profiles, saved hadiths, activity logs, community chat, support threads
- **Firebase Auth** — authentication (email/password + Google OAuth)
- **Firebase Storage** — profile picture uploads

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Firebase project (free Spark plan works)

### 1. Clone the repository
```bash
git clone https://github.com/HazSha28/Hadith--Master.git
cd Hadith--Master
```

### 2. Backend setup
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PGUSER=postgres
PGHOST=localhost
PGDATABASE=hadith_master
PGPASSWORD=yourpassword
PGPORT=5432

GOOGLE_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_groq_api_key   # Groq uses OpenAI-compatible API
```

Set up the PostgreSQL database:
```bash
psql -U postgres -c "CREATE DATABASE hadith_master;"
psql -U postgres -d hadith_master -f db/schema.sql
```

Run the data migration (one-time):
```bash
node db/migrateToPg.js
```

Start the backend:
```bash
npm start
# Server runs on http://localhost:3002
```

### 3. Frontend setup
```bash
cd frontend
npm install
```

The frontend uses a Vite proxy — no `VITE_API_BASE_URL` needed for local development.

Start the frontend:
```bash
npm run dev
# App runs on http://localhost:8080
```

### 4. Firebase setup
1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** (Email/Password + Google)
3. Enable **Firestore Database**
4. Enable **Storage**
5. Copy your Firebase config into `frontend/src/firebase.ts`
6. Deploy Firestore rules:
   ```bash
   cd backend
   npx firebase-tools deploy --only firestore:rules
   ```

---

## 📁 Project Structure

```
Hadith--Master/
├── backend/
│   ├── api/
│   │   ├── server.js          # Express entry point (port 3002)
│   │   ├── hadithApi.js       # REST endpoints
│   │   └── aiSearch.js        # Gemini + Groq AI pipeline
│   ├── db/
│   │   ├── schema.sql         # PostgreSQL schema + GIN indexes
│   │   └── migrateToPg.js     # JSON → PostgreSQL migration
│   ├── firebaseAdmin.js       # Firebase Admin SDK
│   └── firestore.rules        # Firestore security rules
│
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── chat/          # Community chat, admin support
│       │   ├── admin/         # Admin panel components
│       │   └── ui/            # shadcn/ui primitives
│       ├── pages/             # Route pages
│       ├── contexts/          # AuthContext, ThemeContext
│       ├── lib/               # API service, activity logger
│       └── firebase.ts        # Firebase client init
│
└── data/                      # Raw hadith data (CSV, TXT, JSON)
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/api/hadith` | Get hadiths (paginated, filterable) |
| `GET` | `/api/hadith/books` | List all books |
| `GET` | `/api/hadith/categories` | List categories |
| `GET` | `/api/hadith/random` | Random hadith(s) |
| `GET` | `/api/hadith/search?q=...` | Text search (PostgreSQL full-text) |
| `POST` | `/api/hadith/search/ai` | AI-powered search (Gemini + Groq) |
| `POST` | `/api/hadith/explain` | AI explanation of a single hadith |
| `GET` | `/api/hadith/:id` | Get hadith by ID |

**AI Search query params:** `q`, `book`, `grade`, `narrator`, `author`, `characters`

---

## 🔐 Environment Variables

### Backend (`backend/.env`)
| Variable | Required | Description |
|---|---|---|
| `PGUSER` | ✅ | PostgreSQL username |
| `PGHOST` | ✅ | PostgreSQL host |
| `PGDATABASE` | ✅ | Database name |
| `PGPASSWORD` | ✅ | Database password |
| `PGPORT` | ✅ | Database port (default 5432) |
| `GOOGLE_API_KEY` | ✅ | Gemini AI API key |
| `OPENAI_API_KEY` | ✅ | Groq API key (OpenAI-compatible) |

### Frontend (`frontend/.env`)
| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Leave empty for local (uses Vite proxy). Set to backend URL for production. |

---

## 🌐 Exposing via ngrok

To share with others:
```bash
# Terminal 1 — backend
cd backend && npm start

# Terminal 2 — frontend
cd frontend && npm run dev

# Terminal 3 — ngrok (tunnels frontend + proxies backend)
ngrok http 8080
```

The `vite.config.ts` already allows all `.ngrok-free.dev` hosts and proxies `/api` to `localhost:3002`.

---

## 🛡️ Firestore Security Rules Summary

| Collection | Read | Write |
|---|---|---|
| `hadiths`, `books` | Anyone | Admins only |
| `users/{uid}` | Owner or admin | Owner or admin |
| `userCollections/{uid}/savedHadiths` | Owner | Owner |
| `userActivity/{uid}/activities` | Owner | Owner |
| `communityChat/general/messages` | Authenticated | Authenticated (own uid) |
| `communityChat/general/messages` (update) | — | Any authenticated (reactions only) |
| `supportChats/{uid}` | Owner or admin | Owner or admin |
| `admins` | Admins | Admins |

---

## 🤖 AI Pipeline

```
User query
  └─► Gemini 2.0 Flash — keyword extraction
        └─► PostgreSQL — full-text search (to_tsvector + plainto_tsquery)
              └─► Groq (Llama 3.3 70B) — conversational answer generation
                    └─► Response { answer, sources[] }
```

---

## 📱 Pages & Routes

| Route | Access | Description |
|---|---|---|
| `/` | Protected | Beginner home with daily hadith |
| `/advanced` | Protected | Advanced search + practice |
| `/collections/:bookSlug` | Protected | Browse a specific hadith book |
| `/search-results` | Protected | Search results with filters |
| `/profile` | Protected | User dashboard |
| `/admin/panel` | Admin only | Admin management panel |
| `/login` | Public | Login page |
| `/signup` | Public | Registration |

---

## 🙏 Acknowledgements

- Hadith data from [fawazahmed0/hadith-api](https://github.com/fawazahmed0/hadith-api)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- AI powered by [Google Gemini](https://deepmind.google/technologies/gemini) and [Groq](https://groq.com)
- Built with ❤️ for the global Muslim community


