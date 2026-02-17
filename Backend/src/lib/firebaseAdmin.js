const admin = require('firebase-admin');
const fs = require('fs');

function parseServiceAccountFromEnv() {
  const raw =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
    process.env.FIREBASE_SERVICE_ACCOUNT ||
    '';

  if (!raw) return null;

  try {
    const obj = JSON.parse(raw);
    if (obj && obj.private_key) {
      obj.private_key = String(obj.private_key).replace(/\\n/g, '\n');
    }
    return obj;
  } catch (e) {
    return null;
  }
}

function parseServiceAccountFromPath() {
  const p = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '';
  if (!p) return null;
  try {
    const raw = fs.readFileSync(p, 'utf8');
    const obj = JSON.parse(raw);
    if (obj && obj.private_key) {
      obj.private_key = String(obj.private_key).replace(/\\n/g, '\n');
    }
    return obj;
  } catch (e) {
    throw new Error(`Failed to load FIREBASE_SERVICE_ACCOUNT_PATH. Check the file path and permissions: ${p}`);
  }
}

function initFirebaseAdmin() {
  if (admin.apps.length) return admin.app();

  const serviceAccount = parseServiceAccountFromEnv() || parseServiceAccountFromPath();
  if (serviceAccount) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    return admin.app();
  }

  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
  if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        project_id: FIREBASE_PROJECT_ID,
        client_email: FIREBASE_CLIENT_EMAIL,
        private_key: String(FIREBASE_PRIVATE_KEY).replace(/\\n/g, '\n'),
      }),
    });
    return admin.app();
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
    return admin.app();
  }

  throw new Error(
    'Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON (recommended) or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY or GOOGLE_APPLICATION_CREDENTIALS.'
  );
}

function getFirebaseAuth() {
  initFirebaseAdmin();
  return admin.auth();
}

module.exports = { getFirebaseAuth };
