/**
 * Imported as the very first line of both globalSetup and every test file
 * (via setupFiles) so these values are already in `process.env` before
 * `src/config/env.ts` ever runs its zod parse — dotenv's default `config()`
 * call never overwrites a variable that's already set, so whichever of these
 * two entry points runs first "wins" and both end up seeing the same values.
 */
process.env.NODE_ENV = "test";
process.env.DATABASE_URL ??= "postgresql://cocosmart:cocosmart@127.0.0.1:5433/cocosmart_test";
process.env.JWT_ACCESS_SECRET ??= "test_access_secret_do_not_use_in_prod_12345";
process.env.JWT_REFRESH_SECRET ??= "test_refresh_secret_do_not_use_in_prod_67890";
process.env.JWT_ACCESS_EXPIRES_IN ??= "15m";
process.env.JWT_REFRESH_EXPIRES_IN ??= "30d";
process.env.FRONTEND_URL ??= "http://localhost:5173";
process.env.SEED_ADMIN_EMAIL ??= "admin@cocosmart.test";
process.env.SEED_ADMIN_PASSWORD ??= "ChangeMe123!";

export {};
