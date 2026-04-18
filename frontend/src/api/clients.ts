/**
 * API functions for clients.
 */

import apiClient from "./client";
import type { Client, ClientCreate } from "../types";

/** Fetch all clients. */
export async function fetchClients(): Promise<Client[]> {
  const response = await apiClient.get<Client[]>("/clients");
  return response.data;
}

/** Create a new client. Returns the new client ID. */
export async function createClient(
  data: ClientCreate
): Promise<{ id: number; message: string }> {
  const response = await apiClient.post<{ id: number; message: string }>(
    "/clients",
    data
  );
  return response.data;
}
