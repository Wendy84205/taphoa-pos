import app from "../server/_core/index";

/**
 * Vercel Function entrypoint. vercel.json rewrites all /api/* paths here,
 * while the default export prevents the local Express listener from starting.
 */
export default app;
