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

Open http://localhost:5173 and the API is on http://localhost:5000.

Optional: Put your cinematic background at `Frontend/vite-project/public/bg.jpg` (the UI has a gradient fallback).

## Roles
- Passenger: search rides, book seats or parcel delivery, see history.
- Driver: upload Aadhaar + License on signup, post rides, view bookings.

Payments are simulated (UPI, Card, Cash recorded with bookings).