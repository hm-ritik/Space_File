# Space File

A private place for students to keep their documents: notes, assignments, certificates, the PDF you'll definitely need at 2 a.m. before a deadline.

You sign up, upload your files, and get them back whenever you need them. Nobody else can see them. Not other users, and not someone who guesses a URL.


> This project started life as **Ace Pace**. I renamed it to Space File, so you may still see the old name in a few places.

---

## Why I built this

Student documents end up scattered across WhatsApp chats, email drafts, and random Drive folders. I wanted one simple place that's actually private.

I also wanted to build something that looks like a real backend, not a tutorial CRUD app. That meant proper auth, encrypted storage, and handling the bugs you only hit once something is deployed.

---

## What it does

- **Sign up / log in** with JWT-based authentication
- **Upload and download** your documents
- **Encrypted at rest.** Files are encrypted with Fernet before they reach storage
- **Locked to your account.** Every file request is checked against its owner, so changing an ID in a URL won't show you someone else's file (IDOR protection)
- **Profile picture** support
- **Database migrations** handled with Alembic

---

## Built with

| Part | Tech |
|---|---|
| Backend | FastAPI, async SQLAlchemy |
| Database | Supabase Postgres |
| File storage | Supabase Storage |
| Encryption | Fernet (`cryptography`) |
| Auth | JWT |
| Migrations | Alembic |
| Frontend   | Javascript |

---

## How it fits together

```
Frontend  ──►  FastAPI backend  ──►  Supabase Postgres   (users, file metadata)
                    │
                    └──────────────►  Supabase Storage    (encrypted file blobs)
```

1. The frontend sends a request with a JWT.
2. The backend checks who you are, then checks that the file actually belongs to you.
3. On upload, the file is encrypted before being stored. On download, it's decrypted on the way out.

Only metadata lives in Postgres. The files themselves live in Storage, and they're already encrypted by the time they get there.

---

## Things that broke (and what I did about them)

Stuff that works on localhost and falls over in production is where I learned the most.

- **Files kept disappearing on Render.** Render's filesystem is ephemeral, so anything saved to disk vanished on redeploy. I moved file storage to Supabase Storage.
- **Couldn't connect to the database from Render.** My Supabase project (Mumbai region) was reachable over IPv6 only, and Render couldn't reach it. Switching to Supabase's transaction pooler (port 6543) fixed it. That also meant setting `statement_cache_size=0` for asyncpg, because the pooler doesn't support prepared statements.
- **Users could only upload one file.** A stray `unique=True` on `student_id` in the uploads table was limiting everyone to a single file. Removing it (and migrating) fixed it.
- **Profile picture lookup crashed** with a `MultipleResultsFound` error once a user had more than one matching row. I fixed the query so it picks the right record.

---

## Running it locally

You'll need Python 3.10+ and a Supabase project (free tier is fine).

```bash
# 1. Clone
git clone https://github.com/hm-ritik/Space_File.git
cd Space_File

# 2. Backend
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:

```env
DATABASE_URL=postgresql+asyncpg://...      # Supabase pooler URL
SUPABASE_URL=...
SUPABASE_KEY=...
SECRET_KEY=...                             # used to sign JWTs
FERNET_KEY=...                             # used to encrypt files
```

Generate a Fernet key with:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Then run migrations and start the server:

```bash
alembic upgrade head
uvicorn main:app --reload
```

And in another terminal, the frontend:

```bash
cd frontend
pip install -r requirements.txt
streamlit run app.py
```

> ⚠️ Keep your `FERNET_KEY` safe. If you lose it, every file you've encrypted is unrecoverable.

---

## Project structure

```
Space_File/
├── backend/      # FastAPI app: routes, models, auth, encryption
├── frontend/     # UI
└── .gitignore
```

---

## What's next

- Move the backend to AWS EC2 (nginx + uvicorn on Ubuntu) instead of relying on Render
- Keep tightening the frontend

---

## About me

I'm Ritik, a final-year CS student. Space File is my main portfolio project, so feedback, bug reports, and "why did you do it this way?" questions are all welcome. Open an issue, or find me on [GitHub](https://github.com/hm-ritik).
