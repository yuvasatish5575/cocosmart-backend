import { CategoryModel, type CategoryDoc } from "../models/Category";

type CategoryData = Pick<CategoryDoc, "name" | "slug"> & Partial<Pick<CategoryDoc, "description" | "image" | "tone" | "isActive">>;

export const categoryRepository = {
  listActive() {
    return CategoryModel.find({ isActive: true }).sort({ name: 1 }).lean();
  },
  listAll() {
    return CategoryModel.find().sort({ name: 1 }).lean();
  },
  findBySlug(slug: string) {
    return CategoryModel.findOne({ slug }).lean();
  },
  findById(id: string) {
    return CategoryModel.findById(id).lean();
  },
  create(data: CategoryData) {
    return CategoryModel.create(data).then((doc) => doc.toObject());
  },
  update(id: string, data: Partial<CategoryData>) {
    return CategoryModel.findByIdAndUpdate(id, data, { new: true }).lean();
  },
  delete(id: string) {
    return CategoryModel.findByIdAndDelete(id);
  },
};
