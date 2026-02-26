# RideCarry

Secure ride-sharing and parcel delivery booking platform.

Monorepo:
- Backend — Express API (JWT, MongoDB, Multer)
- Frontend — React (Vite), React Router, Framer Motion, CSS (glassmorphism)

## Setup

1) Backend env

Create `Backend/.env` using:

```
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
MONGODB_DB=ridecarry
JWT_SECRET=change_me
CLIENT_URL=http://localhost:5173
UPLOAD_DIR=uploads

# Google sign-in (Firebase Admin) for /api/auth/google
# Provide ONE of the options below.
# Option A (simplest for local dev): point to the downloaded service account JSON file
# FIREBASE_SERVICE_ACCOUNT_PATH=C:\\path\\to\\serviceAccountKey.json
# Option B: provide the full service account JSON (stringified)
# FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
# Option C: provide the 3 fields below
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Optional (Frontend Firebase Web config)

Create `Frontend/vite-project/.env` if you want to override the default Firebase config:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_API_URL=http://localhost:5002
```

2) Install deps

```powershell
cd Backend
npm install

cd ..\Frontend\vite-project
npm install
```

3) Run dev

```powershell
# Terminal 1
cd Backend
npm run dev

# Terminal 2
cd Frontend\vite-project
npm run dev
```

Open http://localhost:5173 and the API is on http://localhost:5002.

## Deployment (Login Fix)

If login works locally but fails after deploying, it is almost always one of these:

1) Frontend is still calling localhost

- In your frontend host (Netlify/Vercel/etc) set:
	- `VITE_API_URL=https://<your-backend-domain>`

2) Backend is blocking your deployed frontend via CORS

- In your backend host set one of:
	- `CLIENT_URLS=https://<your-frontend-domain>`
	- Or multiple, comma-separated: `CLIENT_URLS=https://site1.com,https://site2.com`

Notes:
- This backend also allows common hosts like `*.netlify.app` and `*.vercel.app` by default.
- If you use a custom domain, add it to `CLIENT_URLS`.

Optional: Put your cinematic background at `Frontend/vite-project/public/bg.jpg` (the UI has a gradient fallback).

## Roles
- Passenger: search rides, book seats or parcel delivery, see history.
- Driver: upload Aadhaar + License on signup, post rides, view bookings.

Payments are simulated (UPI, Card, Cash recorded with bookings).