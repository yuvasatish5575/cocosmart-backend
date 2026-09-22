import { Router } from "express";
import { uploadController } from "../controllers/uploadController";
import { uploadImage } from "../middleware/upload";
import { authenticate, authorize } from "../middleware/auth";

export const uploadRoutes = Router();

/**
 * @openapi
 * /uploads/image:
 *   post:
 *     tags: [Uploads]
 *     summary: Upload a product/category image (admin only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image: { type: string, format: binary }
 *     responses:
 *       200: { description: Uploaded image URL }
 */
uploadRoutes.post("/image", authenticate, authorize("ADMIN"), uploadImage.single("image"), uploadController.image);
