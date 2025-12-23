# Backend for Laptop Showcase

Simple Node + Express backend providing authentication endpoints for the frontend.

## Setup

1. Open `backend` folder and install dependencies:

```bash
cd backend
npm install
```

2. Create a `.env` file (copy from `.env.example`) and set `MONGO_URI` and `JWT_SECRET`.

3. Start the server (development):

```bash
npm run dev
```

4. Endpoints:
- `POST /api/auth/register` { name, email, password }
- `POST /api/auth/login` { email, password }

Responses are JSON. Adjust controller logic for production (validation, rate limiting, HTTPS, secure cookies, etc.).
