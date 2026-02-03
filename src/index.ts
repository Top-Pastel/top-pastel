import 'dotenv/config';

console.log("JWT_SECRET existe?", !!process.env.JWT_SECRET);
console.log("OAUTH_SERVER_URL:", process.env.OAUTH_SERVER_URL);
console.log("STRIPE_SECRET_KEY existe?", !!process.env.STRIPE_SECRET_KEY);

export const platformServer = true;

