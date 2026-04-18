/**
 * API functions for invoices.
 *
 * Each function wraps a single endpoint and returns typed data.
 * The components never touch axios directly — they call these.
 */

import apiClient from "./client";
import type { Invoice, InvoiceCreate, InvoiceSummary } from "../types";

/** Fetch all invoices (lightweight, no nested items). */
export async function fetchInvoices(): Promise<InvoiceSummary[]> {
  const response = await apiClient.get<InvoiceSummary[]>("/invoices");
  return response.data;
}

/** Fetch a single invoice with full line-item details. */
export async function fetchInvoice(id: number): Promise<Invoice> {
  const response = await apiClient.get<Invoice>(`/invoices/${id}`);
  return response.data;
}

/** Create a new invoice. Returns the new invoice's ID. */
export async function createInvoice(
  data: InvoiceCreate
): Promise<{ id: number; message: string }> {
  const response = await apiClient.post<{ id: number; message: string }>(
    "/invoices",
    data
  );
  return response.data;
}

/** Update the status of an existing invoice. */
export async function updateInvoiceStatus(
  id: number,
  status: string
): Promise<{ id: number; status: string; message: string }> {
  const response = await apiClient.patch<{
    id: number;
    status: string;
    message: string;
  }>(`/invoices/${id}`, { status });
  return response.data;
}
