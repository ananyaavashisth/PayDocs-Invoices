/**
 * API functions for businesses.
 */

import apiClient from "./client";
import type { Business, BusinessCreate } from "../types";

/** Fetch all businesses. */
export async function fetchBusinesses(): Promise<Business[]> {
  const response = await apiClient.get<Business[]>("/businesses");
  return response.data;
}

/** Create a new business. Returns the new business ID. */
export async function createBusiness(
  data: BusinessCreate
): Promise<{ id: number; message: string }> {
  const response = await apiClient.post<{ id: number; message: string }>(
    "/businesses",
    data
  );
  return response.data;
}
