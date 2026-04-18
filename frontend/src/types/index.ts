/**
 * TypeScript interfaces matching the backend Pydantic schemas.
 *
 * All monetary values are integers (cents).
 * Tax rate is in basis points (e.g. 1000 = 10.00%).
 */

// ---------------------------------------------------------------------------
// Business
// ---------------------------------------------------------------------------

export interface Business {
  id: number;
  name: string;
  address: string;
  tax_id: string | null;
}

export interface BusinessCreate {
  name: string;
  address: string;
  tax_id?: string;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export interface Client {
  id: number;
  name: string;
  email: string;
  address: string;
}

export interface ClientCreate {
  name: string;
  email: string;
  address: string;
}

// ---------------------------------------------------------------------------
// Invoice Item
// ---------------------------------------------------------------------------

export interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number; // cents
}

export interface InvoiceItemCreate {
  description: string;
  quantity: number;   // must be > 0
  unit_price: number; // cents, must be >= 0
}

// ---------------------------------------------------------------------------
// Invoice
// ---------------------------------------------------------------------------

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

/** Lightweight invoice summary (returned by GET /api/invoices) */
export interface InvoiceSummary {
  id: number;
  business_id: number;
  client_id: number;
  invoice_number: string;
  issue_date: string;  // ISO date string
  due_date: string;    // ISO date string
  tax_rate: number;    // basis points
  total_amount: number; // cents
  currency: "USD" | "INR";
  status: InvoiceStatus;
}

/** Full invoice with line items (returned by GET /api/invoices/:id) */
export interface Invoice extends InvoiceSummary {
  items: InvoiceItem[];
}

/** Payload for POST /api/invoices */
export interface InvoiceCreate {
  business_id: number;
  client_id: number;
  invoice_number: string;
  issue_date: string;  // ISO date string
  due_date: string;    // ISO date string
  tax_rate: number;    // basis points
  currency: "USD" | "INR";
  items: InvoiceItemCreate[];
}

// ---------------------------------------------------------------------------
// API Error
// ---------------------------------------------------------------------------

export interface ValidationErrorDetail {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface ApiValidationError {
  error: string;
  details: ValidationErrorDetail[];
}
