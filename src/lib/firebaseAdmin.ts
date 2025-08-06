
import "server-only";
import admin, { App } from "firebase-admin";

const serviceAccount = {
  "type": "service_account",
  "project_id": process.env.FIREBASE_ADMIN_PROJECT_ID,
  "private_key_id": process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID,
  "private_key": process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  "client_email": process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  "client_id": process.env.FIREBASE_ADMIN_CLIENT_ID,
  "auth_uri": process.env.FIREBASE_ADMIN_AUTH_URI,
  "token_uri": process.env.FIREBASE_ADMIN_TOKEN_URI,
  "auth_provider_x509_cert_url": process.env.FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL,
  "client_x509_cert_url": process.env.FIREBASE_ADMIN_CLIENT_X509_CERT_URL,
  "universe_domain": process.env.FIREBASE_ADMIN_UNIVERSE_DOMAIN
} as admin.ServiceAccount;

let app: App;
let db: admin.firestore.Firestore | null = null;

if (!admin.apps.length) {
  try {
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    db = admin.firestore();
  } catch (error: any) {
    console.error(
      "[FIREBASE_ADMIN_LOG] CRITICAL ERROR during SDK initialization:",
      error.message,
      "Stack:", error.stack
    );
  }
} else {
  app = admin.app();
  db = admin.firestore();
}

export { db };
