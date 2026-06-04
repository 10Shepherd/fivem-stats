import { neon } from "@neondatabase/serverless";

// Neon gives you a DATABASE_URL in their dashboard
// Add it to Vercel environment variables as DATABASE_URL
const sql = neon(process.env.DATABASE_URL);

export default sql;
