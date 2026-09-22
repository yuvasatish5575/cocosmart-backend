import "dotenv/config";
import { connectDB, disconnectDB } from "./config/db";
import { UserModel } from "./models/User";

/**
 * Promotes an already-registered user to ADMIN by email. Deliberately takes
 * no password — the account owner sets their own password when they register
 * through the normal /auth/register flow, so it never has to pass through
 * this script (or anyone running it) at all.
 *
 * Usage: npm run make-admin -- someone@example.com
 */
async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error("Usage: npm run make-admin -- <email>");
    process.exit(1);
  }

  await connectDB();

  const user = await UserModel.findOne({ email });
  if (!user) {
    console.error(`No account found for ${email}.`);
    console.error("Register that account first (e.g. via the storefront's sign-up page), then re-run this command.");
    process.exit(1);
  }

  if (user.role === "ADMIN") {
    console.log(`${email} is already an admin.`);
  } else {
    user.role = "ADMIN";
    await user.save();
    console.log(`${email} is now an admin. They can sign in to the admin dashboard with their existing password.`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectDB();
  });
