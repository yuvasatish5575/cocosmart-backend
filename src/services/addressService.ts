import { addressRepository } from "../repositories/addressRepository";
import { ApiError } from "../utils/ApiError";
import { toPublicAddress } from "../utils/presenters";
import type { AddressInput, UpdateAddressInput } from "../types/dto";

export const addressService = {
  async list(userId: string) {
    const addresses = await addressRepository.listForUser(userId);
    return addresses.map(toPublicAddress);
  },

  async create(userId: string, input: AddressInput) {
    if (input.isDefault) {
      await addressRepository.clearDefaultForUser(userId);
    }
    const address = await addressRepository.create(userId, input);
    return toPublicAddress(address);
  },

  async update(userId: string, addressId: string, input: UpdateAddressInput) {
    const existing = await addressRepository.findById(addressId);
    if (!existing || existing.userId.toString() !== userId) throw ApiError.notFound("Address not found");
    if (input.isDefault) {
      await addressRepository.clearDefaultForUser(userId);
    }
    const updated = await addressRepository.update(addressId, input);
    return toPublicAddress(updated!);
  },

  async remove(userId: string, addressId: string) {
    const existing = await addressRepository.findById(addressId);
    if (!existing || existing.userId.toString() !== userId) throw ApiError.notFound("Address not found");
    await addressRepository.delete(addressId);
  },
};
