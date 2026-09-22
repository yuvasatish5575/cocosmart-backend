import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { app, unique } from "./helpers";
import { emailService } from "../src/services/emailService";
import { EmailVerificationModel } from "../src/models/EmailVerification";

const PASSWORD = "Passw0rd!23";

async function registerAndCaptureCode(email: string) {
  const spy = vi.spyOn(emailService, "sendVerificationEmail");
  const res = await request(app)
    .post("/api/auth/register")
    .send({ name: "Verify Tester", email, password: PASSWORD, confirmPassword: PASSWORD });
  const code = spy.mock.calls.at(-1)?.[1] as string;
  spy.mockRestore();
  return { registerRes: res, code };
}

/**
 * Rewinds the most recent verification record's timestamp fields, to
 * simulate elapsed time (expiry, cooldown) without a real wait. Goes through
 * the raw MongoDB driver collection rather than Mongoose's `updateOne`/`save`
 * — the schema's `timestamps` option makes `createdAt` immutable, so neither
 * of those can actually change it; only bypassing Mongoose entirely can.
 */
async function backdateLatestRecord(email: string, fields: { createdAt?: Date; expiresAt?: Date }) {
  const record = await EmailVerificationModel.findOne({ email }).sort({ createdAt: -1 }).lean();
  if (!record) throw new Error(`No verification record found for ${email}`);
  await EmailVerificationModel.collection.updateOne({ _id: record._id }, { $set: fields });
}

describe("Email verification", () => {
  it("rejects an incorrect code without consuming the correct one", async () => {
    const email = `${unique("wrongcode")}@example.com`;
    const { code } = await registerAndCaptureCode(email);
    const wrongCode = code === "000000" ? "111111" : "000000";

    const wrong = await request(app).post("/api/auth/verify-email").send({ email, code: wrongCode });
    expect(wrong.status).toBe(400);
    expect(wrong.body.error.code).toBe("VALIDATION_ERROR");

    const right = await request(app).post("/api/auth/verify-email").send({ email, code });
    expect(right.status).toBe(200);
  });

  it("locks the code out after 5 incorrect attempts, even before it would otherwise expire", async () => {
    const email = `${unique("lockout")}@example.com`;
    const { code } = await registerAndCaptureCode(email);
    const wrongCode = code === "000000" ? "111111" : "000000";

    let last;
    for (let i = 0; i < 5; i++) {
      last = await request(app).post("/api/auth/verify-email").send({ email, code: wrongCode });
    }
    expect(last!.status).toBe(429);
    expect(last!.body.error.code).toBe("TOO_MANY_REQUESTS");

    // Even the *correct* code is now rejected — a new one must be requested.
    const afterLockout = await request(app).post("/api/auth/verify-email").send({ email, code });
    expect(afterLockout.status).toBe(400);
  });

  it("rejects an expired code and accepts a freshly resent one", async () => {
    const email = `${unique("expired")}@example.com`;
    const { code } = await registerAndCaptureCode(email);

    // Force the stored code into the past rather than waiting out the real 10-minute
    // TTL — backdating createdAt too so the resend cooldown below reads as elapsed,
    // matching what real elapsed time would look like.
    await backdateLatestRecord(email, { expiresAt: new Date(Date.now() - 1000), createdAt: new Date(Date.now() - 11 * 60 * 1000) });

    const expired = await request(app).post("/api/auth/verify-email").send({ email, code });
    expect(expired.status).toBe(400);
    expect(expired.body.error.message).toMatch(/expired/i);

    const spy = vi.spyOn(emailService, "sendVerificationEmail");
    const resend = await request(app).post("/api/auth/resend-code").send({ email });
    expect(resend.status).toBe(200);
    const newCode = spy.mock.calls.at(-1)?.[1] as string;
    spy.mockRestore();

    const verified = await request(app).post("/api/auth/verify-email").send({ email, code: newCode });
    expect(verified.status).toBe(200);
  });

  it("enforces a cooldown between consecutive resend requests", async () => {
    const email = `${unique("cooldown")}@example.com`;
    await registerAndCaptureCode(email);

    const tooSoon = await request(app).post("/api/auth/resend-code").send({ email });
    expect(tooSoon.status).toBe(429);
    expect(tooSoon.body.error.code).toBe("TOO_MANY_REQUESTS");

    // Backdate the existing code past the cooldown window instead of a real 30s wait.
    await backdateLatestRecord(email, { createdAt: new Date(Date.now() - 31_000) });

    const afterCooldown = await request(app).post("/api/auth/resend-code").send({ email });
    expect(afterCooldown.status).toBe(200);
  });

  it("does not reveal whether an email is registered when resending", async () => {
    const res = await request(app).post("/api/auth/resend-code").send({ email: "nobody-here@example.com" });
    expect(res.status).toBe(200);
  });

  it("tells the caller to verify instead of creating a duplicate when the email exists but is unverified", async () => {
    const email = `${unique("dupeunverified")}@example.com`;
    await registerAndCaptureCode(email);

    const secondAttempt = await request(app)
      .post("/api/auth/register")
      .send({ name: "Verify Tester", email, password: PASSWORD, confirmPassword: PASSWORD });

    expect(secondAttempt.status).toBe(403);
    expect(secondAttempt.body.error.code).toBe("EMAIL_NOT_VERIFIED");
  });
});
