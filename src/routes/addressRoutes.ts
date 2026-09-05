import { Router } from "express";
import { addressController } from "../controllers/addressController";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import { addressSchema, updateAddressSchema } from "../validators/addressValidators";
import { idParamSchema } from "../validators/productValidators";

export const addressRoutes = Router();
addressRoutes.use(authenticate);

addressRoutes.get("/", addressController.list);
addressRoutes.post("/", validate({ body: addressSchema }), addressController.create);
addressRoutes.put("/:id", validate({ params: idParamSchema, body: updateAddressSchema }), addressController.update);
addressRoutes.delete("/:id", validate({ params: idParamSchema }), addressController.remove);
