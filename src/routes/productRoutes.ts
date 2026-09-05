import { Router } from "express";
import { productController } from "../controllers/productController";
import { validate } from "../middleware/validate";
import { authenticate, authorize } from "../middleware/auth";
import { createProductSchema, idParamSchema, productListQuerySchema, slugParamSchema, updateProductSchema } from "../validators/productValidators";

export const productRoutes = Router();

/**
 * @openapi
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: List active products
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 12 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         description: Category slug
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [popularity, price_asc, price_desc, rating, newest] }
 *     responses:
 *       200: { description: Paginated product list }
 */
productRoutes.get("/", validate({ query: productListQuerySchema }), productController.list);

/**
 * @openapi
 * /api/products/admin:
 *   get:
 *     tags: [Products]
 *     summary: List all products, including inactive (admin only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Paginated product list }
 */
productRoutes.get("/admin", authenticate, authorize("ADMIN"), validate({ query: productListQuerySchema }), productController.listAdmin);

productRoutes.get("/id/:id", authenticate, authorize("ADMIN"), validate({ params: idParamSchema }), productController.getById);

/**
 * @openapi
 * /api/products/slug/{slug}:
 *   get:
 *     tags: [Products]
 *     summary: Get an active product by slug
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Product detail }
 *       404: { description: Not found }
 */
productRoutes.get("/slug/:slug", validate({ params: slugParamSchema }), productController.getBySlug);

/**
 * @openapi
 * /api/products:
 *   post:
 *     tags: [Products]
 *     summary: Create a product (admin only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Product created }
 *       403: { description: Not an admin }
 */
productRoutes.post("/", authenticate, authorize("ADMIN"), validate({ body: createProductSchema }), productController.create);

/**
 * @openapi
 * /api/products/{id}:
 *   put:
 *     tags: [Products]
 *     summary: Update a product (admin only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Product updated }
 *   delete:
 *     tags: [Products]
 *     summary: Deactivate a product (admin only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204: { description: Deactivated }
 */
productRoutes.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate({ params: idParamSchema, body: updateProductSchema }),
  productController.update
);
productRoutes.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate({ params: idParamSchema, body: updateProductSchema }),
  productController.update
);
productRoutes.delete("/:id", authenticate, authorize("ADMIN"), validate({ params: idParamSchema }), productController.remove);
