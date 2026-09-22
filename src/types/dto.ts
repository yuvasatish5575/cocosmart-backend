import type { z } from "zod";
import type {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendCodeSchema,
  loginOtpRequestSchema,
  loginOtpVerifySchema,
} from "../validators/authValidators";
import type { createProductSchema, updateProductSchema, productListQuerySchema } from "../validators/productValidators";
import type { createCategorySchema, updateCategorySchema } from "../validators/categoryValidators";
import type { addCartItemSchema, updateCartItemSchema } from "../validators/cartValidators";
import type { addressSchema, updateAddressSchema } from "../validators/addressValidators";
import type { checkoutSchema, orderListQuerySchema } from "../validators/orderValidators";

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendCodeInput = z.infer<typeof resendCodeSchema>;
export type LoginOtpRequestInput = z.infer<typeof loginOtpRequestSchema>;
export type LoginOtpVerifyInput = z.infer<typeof loginOtpVerifySchema>;

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductListQuery = z.infer<typeof productListQuerySchema>;

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

export type AddressInput = z.infer<typeof addressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type OrderListQuery = z.infer<typeof orderListQuerySchema>;
