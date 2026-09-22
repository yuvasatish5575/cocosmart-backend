import { z } from "zod";

/**
 * Official Indian States and Union Territories. Single source of truth for
 * server-side address validation — never trust the client's dropdown alone.
 * The frontend's State selector should use this exact same list so the two
 * never drift apart; there's no shared-package boundary between the two
 * repos, so keep them in sync by hand if either list changes.
 */
export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  // Union Territories
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;

export type IndianState = (typeof INDIAN_STATES)[number];

export const indianStateSchema = z.enum(INDIAN_STATES);

/** Indian mobile numbers: exactly 10 digits, starting with 6-9. */
export const indianPhoneSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number");

/** Indian postal (PIN) codes: exactly 6 digits. */
export const pinCodeSchema = z.string().trim().regex(/^\d{6}$/, "Please enter a valid 6-digit PIN code");
