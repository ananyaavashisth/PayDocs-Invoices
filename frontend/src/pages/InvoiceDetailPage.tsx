import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  Loader2, 
  AlertCircle, 
  Building2, 
  User, 
  RefreshCw, 
  ChevronLeft, 
  Printer 
} from "lucide-react";
import { fetchInvoice, updateInvoiceStatus } from "../api/invoices";
import { fetchBusinesses } from "../api/businesses";
import { fetchClients } from "../api/clients";
import { centsToDisplay } from "../utils/format";
import type { Invoice, Business, Client } from "../types";

/**
 * InvoiceDetailPage — Displays a detailed preview of an invoice.
 * Supports printing via browser print dialog.
 */
// Status Badge Component (reused logic)
const StatusBadge = ({ status, dueDate }: { status: string; dueDate: string }) => {
  const isOverdue = status !== "paid" && new Date(dueDate) < new Date(new Date().setHours(0,0,0,0));
  const effectiveStatus = isOverdue ? "overdue" : status;

  const styles: Record<string, string> = {
    paid: "bg-green-100 text-green-700 border-green-200",
    sent: "bg-blue-100 text-blue-700 border-blue-200",
    draft: "bg-surface-100 text-surface-600 border-surface-200",
    overdue: "bg-amber-100 text-amber-700 border-amber-200",
    cancelled: "bg-surface-200 text-surface-500 border-surface-300",
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize tracking-wide ${styles[effectiveStatus] ?? styles.draft}`}>
      {effectiveStatus}
    </span>
  );
};

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        const inv = await fetchInvoice(parseInt(id, 10));
        
        // Fetch specific business and client for metadata
        const [bizList, clientList] = await Promise.all([
          fetchBusinesses(),
          fetchClients(),
        ]);
        
        const biz = bizList.find(b => b.id === inv.business_id);
        const cl = clientList.find(c => c.id === inv.client_id);
        
        setInvoice(inv);
        setBusiness(biz || null);
        setClient(cl || null);
      } catch (err) {
        setError("Could not find the invoice you're looking for.");
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!invoice) return;
    setUpdatingStatus(true);
    try {
      await updateInvoiceStatus(invoice.id, newStatus);
      // Update local state instead of full reload for speed
      setInvoice({ ...invoice, status: newStatus });
    } catch (err) {
      alert("Failed to update status. Please try again.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
        <p className="mt-4 text-surface-500">Retrieving invoice details...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-danger">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-surface-900">Invoice not found</h2>
        <p className="mt-2 text-surface-500">{error || "The invoice ID is invalid or has been removed."}</p>
        <button
          onClick={() => navigate("/")}
          className="mt-8 font-semibold text-primary-600 hover:text-primary-700"
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  // Calculate subtotal for display
  const subtotalCents = invoice.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const taxCents = Math.round(subtotalCents * (invoice.tax_rate / 10000));

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Action Bar */}
      <div className="mb-8 flex flex-col items-center justify-between gap-6 sm:flex-row print:hidden">
        <Link
          to="/"
          className="group inline-flex items-center gap-2 text-sm font-semibold text-surface-500 transition-colors hover:text-primary-600"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to Dashboard
        </Link>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3 rounded-xl border border-surface-200 bg-white px-4 py-2 shadow-sm ring-1 ring-surface-900/5">
            <StatusBadge status={invoice.status} dueDate={invoice.due_date} />
            <div className="h-4 w-[1px] bg-surface-200 mx-1" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] lowercase font-bold text-surface-400">Status:</span>
              <div className="relative">
                <select 
                  value={invoice.status}
                  disabled={updatingStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="bg-transparent border-none p-0 text-sm font-black text-surface-900 outline-none cursor-pointer disabled:opacity-50 hover:text-primary-600 transition-colors"
                >
                  <option value="draft">DRAFT</option>
                  <option value="sent">SENT</option>
                  <option value="paid">PAID</option>
                  <option value="overdue">OVERDUE</option>
                  <option value="cancelled">CANCELLED</option>
                </select>
                {updatingStatus && <RefreshCw className="h-3 w-3 animate-spin text-primary-500" />}
              </div>
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-xl bg-surface-900 px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-surface-800 active:scale-95"
          >
            <Printer className="h-4 w-4" />
            Print PDF
          </button>
        </div>
      </div>

      {/* Invoice Paper */}
      <div 
        ref={printRef}
        className="rounded-2xl border border-surface-200 bg-white p-12 shadow-sm ring-1 ring-surface-900/5 print:border-none print:shadow-none print:p-0"
      >
        {/* Invoice Header */}
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary-600 text-white font-bold text-xl uppercase">
                {business?.name.charAt(0) || "P"}
              </div>
              <span className="text-2xl font-bold tracking-tight text-surface-900">
                {business?.name || "Your Business"}
              </span>
            </div>
            <div className="text-sm text-surface-500 leading-relaxed max-w-xs">
              {business?.address.split(',').map((line, i) => (
                <div key={i}>{line.trim()}</div>
              ))}
              {business?.tax_id && <div className="mt-2 font-medium">Tax ID: {business.tax_id}</div>}
            </div>
          </div>

          <div className="text-right sm:text-right">
            <h1 className="text-4xl font-black uppercase tracking-tight text-surface-200 print:text-surface-300">
              Invoice
            </h1>
            <div className="mt-4 space-y-2">
              <div className="text-sm font-semibold text-surface-900">
                # {invoice.invoice_number}
              </div>
              <div className="hidden print:block">
                <StatusBadge status={invoice.status} dueDate={invoice.due_date} />
              </div>
              <div className="text-sm text-surface-500">
                Issued: {new Date(invoice.issue_date).toLocaleDateString()}
              </div>
              <div className="text-sm text-surface-500">
                Due: {new Date(invoice.due_date).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Bill To Section */}
        <div className="mt-16 grid grid-cols-1 gap-12 sm:grid-cols-2">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-surface-400 mb-4">
              Bill To
            </div>
            <div className="flex flex-col gap-1">
              <div className="font-bold text-surface-900 text-lg">
                {client?.name || "Valued Client"}
              </div>
              <div className="text-sm text-surface-500">
                {client?.email}
              </div>
              <div className="mt-2 text-sm text-surface-500 leading-relaxed max-w-xs whitespace-pre-line">
                {client?.address}
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mt-16">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-surface-900 text-xs font-bold uppercase tracking-wider text-surface-900">
                  <th className="py-4 pr-4">Description</th>
                  <th className="py-4 px-4 text-center w-24">Qty</th>
                  <th className="py-4 px-4 text-right w-32">Rate</th>
                  <th className="py-4 pl-4 text-right w-32">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {invoice.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-5 pr-4 text-sm font-medium text-surface-900">
                      {item.description}
                    </td>
                    <td className="py-5 px-4 text-sm text-center text-surface-600">
                      {item.quantity}
                    </td>
                    <td className="py-5 px-4 text-sm text-right text-surface-600">
                      {centsToDisplay(item.unit_price, invoice.currency)}
                    </td>
                    <td className="py-5 pl-4 text-sm font-bold text-right text-surface-900">
                      {centsToDisplay(item.quantity * item.unit_price, invoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Section */}
        <div className="mt-8 flex justify-end">
          <div className="w-full max-w-xs space-y-3">
            <div className="flex justify-between text-sm text-surface-500">
              <span>Subtotal</span>
              <span className="font-medium text-surface-900">{centsToDisplay(subtotalCents, invoice.currency)}</span>
            </div>
            <div className="flex justify-between text-sm text-surface-500">
              <span>Tax ({invoice.tax_rate / 100}%)</span>
              <span className="font-medium text-surface-900">{centsToDisplay(taxCents, invoice.currency)}</span>
            </div>
            <div className="flex justify-between border-t-2 border-surface-900 pt-4 text-lg font-black text-surface-900 uppercase tracking-tight">
              <span>Total Amount</span>
              <span className="text-2xl">{centsToDisplay(invoice.total_amount, invoice.currency)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-24 pt-8 border-t border-surface-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-xs text-surface-400 leading-relaxed">
              <p className="font-bold text-surface-900 mb-1">Payment Instructions</p>
              Please include the invoice number with your payment. Thank you for your business!
            </div>
          </div>
        </div>
      </div>

      {/* Print Specific Styles */}
      <style>{`
        @media print {
          @page {
            margin: 20mm;
            size: A4;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .flex-1 {
            padding: 0 !important;
          }
          aside {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
