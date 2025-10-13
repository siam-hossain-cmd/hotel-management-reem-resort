import admin from 'firebase-admin';

export default async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  if (!idToken) return res.status(401).json({ error: 'Missing token' });

  try {
    if (!admin.apps.length) {
      return res.status(500).json({ error: 'Firebase admin not initialized' });
    }
    const decoded = await admin.auth().verifyIdToken(idToken);
    // Attach minimal user info
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      roles: decoded.roles || decoded.role || null,
      claims: decoded
    };
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
