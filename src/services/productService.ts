import { productRepository } from "../repositories/productRepository";
import { categoryRepository } from "../repositories/categoryRepository";
import { ApiError } from "../utils/ApiError";
import { toPublicProduct } from "../utils/presenters";
import { paginationMeta, toSkipTake } from "../utils/pagination";
import type { CreateProductInput, ProductListQuery, UpdateProductInput } from "../types/dto";
import type { Prisma } from "@prisma/client";

export const productService = {
  async list(query: ProductListQuery, opts: { activeOnly: boolean }) {
    const { skip, take } = toSkipTake({ page: query.page, limit: query.limit });
    const [rows, total] = await productRepository.list({
      search: query.search,
      categorySlug: query.category,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      featured: query.featured,
      inStockOnly: query.inStockOnly,
      activeOnly: opts.activeOnly,
      sort: query.sort,
      skip,
      take,
    });
    return {
      products: rows.map(toPublicProduct),
      pagination: paginationMeta({ page: query.page, limit: query.limit }, total),
    };
  },

  async getBySlug(slug: string, opts: { activeOnly: boolean }) {
    const product = await productRepository.findBySlug(slug);
    if (!product || (opts.activeOnly && !product.isActive)) {
      throw ApiError.notFound("Product not found");
    }
    return toPublicProduct(product);
  },

  async getById(id: string) {
    const product = await productRepository.findById(id);
    if (!product) throw ApiError.notFound("Product not found");
    return toPublicProduct(product);
  },

  async create(input: CreateProductInput) {
    const category = await categoryRepository.findById(input.categoryId);
    if (!category) throw ApiError.badRequest("categoryId does not reference an existing category");

    const product = await productRepository.create({
      name: input.name,
      slug: input.slug,
      description: input.description,
      shortDescription: input.shortDescription,
      price: input.price,
      discountPrice: input.discountPrice,
      sku: input.sku,
      stockQuantity: input.stockQuantity,
      unit: input.unit,
      sizes: input.sizes,
      image: input.image,
      images: input.images,
      tone: input.tone,
      benefits: input.benefits as unknown as Prisma.InputJsonValue,
      ingredients: input.ingredients,
      nutritionalInformation: input.nutritionalInformation as unknown as Prisma.InputJsonValue,
      storage: input.storage,
      origin: input.origin,
      traceability: (input.traceability ?? undefined) as unknown as Prisma.InputJsonValue,
      isFeatured: input.isFeatured,
      isActive: input.isActive,
      category: { connect: { id: input.categoryId } },
    });
    return toPublicProduct(product);
  },

  async update(id: string, input: UpdateProductInput) {
    const existing = await productRepository.findById(id);
    if (!existing) throw ApiError.notFound("Product not found");

    if (input.categoryId) {
      const category = await categoryRepository.findById(input.categoryId);
      if (!category) throw ApiError.badRequest("categoryId does not reference an existing category");
    }

    const { categoryId, benefits, nutritionalInformation, traceability, ...rest } = input;
    const product = await productRepository.update(id, {
      ...rest,
      ...(benefits !== undefined ? { benefits: benefits as unknown as Prisma.InputJsonValue } : {}),
      ...(nutritionalInformation !== undefined ? { nutritionalInformation: nutritionalInformation as unknown as Prisma.InputJsonValue } : {}),
      ...(traceability !== undefined ? { traceability: (traceability ?? undefined) as unknown as Prisma.InputJsonValue } : {}),
      ...(categoryId ? { category: { connect: { id: categoryId } } } : {}),
    });
    return toPublicProduct(product);
  },

  /** Soft delete — deactivates rather than hard-deletes so historical orders keep a valid product reference. */
  async deactivate(id: string) {
    const existing = await productRepository.findById(id);
    if (!existing) throw ApiError.notFound("Product not found");
    await productRepository.softDelete(id);
  },
};
