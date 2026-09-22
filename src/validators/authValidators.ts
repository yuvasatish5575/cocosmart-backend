import { z } from "zod";

/** Shared by registration and password reset — both create/replace the credential guarding an account. */
const strongPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128)
  .regex(/[A-Z]/, "Password must include at least one uppercase letter")
  .regex(/[a-z]/, "Password must include at least one lowercase letter")
  .regex(/[0-9]/, "Password must include at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must include at least one special character");

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().trim().toLowerCase().email("Enter a valid email address"),
    password: strongPassword,
    confirmPassword: z.string(),
    phone: z.string().trim().min(7).max(20).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "refreshToken is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  /** Where the emailed reset link should point back to — the calling app's own origin. Validated against the FRONTEND_URL allowlist server-side, so it can't be used to redirect the email to an arbitrary domain. */
  redirectUrl: z.string().trim().url().optional(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "token is required"),
  password: strongPassword,
});

export const verifyEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit verification code"),
});

export const resendCodeSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
});

export const loginOtpRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
});

export const loginOtpVerifySchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
});
