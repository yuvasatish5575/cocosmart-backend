import { Router } from "express";
import { categoryController } from "../controllers/categoryController";
import { validate } from "../middleware/validate";
import { authenticate, authorize, optionalAuthenticate } from "../middleware/auth";
import { createCategorySchema, updateCategorySchema } from "../validators/categoryValidators";
import { idParamSchema } from "../validators/productValidators";

export const categoryRoutes = Router();

/**
 * @openapi
 * /categories:
 *   get:
 *     tags: [Categories]
 *     summary: List categories (active only, unless called by an admin)
 *     responses:
 *       200: { description: Category list }
 *   post:
 *     tags: [Categories]
 *     summary: Create a category (admin only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Category created }
 */
categoryRoutes.get("/", optionalAuthenticate, categoryController.list);
categoryRoutes.post("/", authenticate, authorize("ADMIN"), validate({ body: createCategorySchema }), categoryController.create);
categoryRoutes.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate({ params: idParamSchema, body: updateCategorySchema }),
  categoryController.update
);
categoryRoutes.delete("/:id", authenticate, authorize("ADMIN"), validate({ params: idParamSchema }), categoryController.remove);
