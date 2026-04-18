import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import InvoiceForm from "../components/InvoiceForm";

/**
 * CreateInvoicePage — The page wrapper for the invoice creation form.
 */
export default function CreateInvoicePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header with back button */}
      <div className="mb-8">
        <Link
          to="/"
          className="group inline-flex items-center gap-2 text-sm font-medium text-surface-500 transition-colors hover:text-primary-600"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to Dashboard
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-surface-900">
          Create New Invoice
        </h1>
        <p className="mt-2 text-surface-500">
          Fill in the details below to generate a professional invoice.
        </p>
      </div>

      {/* The Form */}
      <div className="mt-10">
        <InvoiceForm />
      </div>
    </div>
  );
}
