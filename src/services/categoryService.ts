import { categoryRepository } from "../repositories/categoryRepository";
import { productRepository } from "../repositories/productRepository";
import { ApiError } from "../utils/ApiError";
import { toPublicCategory } from "../utils/presenters";
import type { CreateCategoryInput, UpdateCategoryInput } from "../types/dto";

export const categoryService = {
  async list(opts: { activeOnly: boolean }) {
    const rows = opts.activeOnly ? await categoryRepository.listActive() : await categoryRepository.listAll();
    return rows.map(toPublicCategory);
  },

  async create(input: CreateCategoryInput) {
    const existing = await categoryRepository.findBySlug(input.slug);
    if (existing) throw ApiError.conflict("A category with this slug already exists");
    const category = await categoryRepository.create(input);
    return toPublicCategory(category);
  },

  async update(id: string, input: UpdateCategoryInput) {
    const existing = await categoryRepository.findById(id);
    if (!existing) throw ApiError.notFound("Category not found");
    const category = await categoryRepository.update(id, input);
    return toPublicCategory(category);
  },

  async remove(id: string) {
    const existing = await categoryRepository.findById(id);
    if (!existing) throw ApiError.notFound("Category not found");
    const productCount = await productRepository.count({ categoryId: id });
    if (productCount > 0) {
      throw ApiError.conflict(`Cannot delete a category with ${productCount} product(s). Deactivate it instead.`);
    }
    await categoryRepository.delete(id);
  },
};
