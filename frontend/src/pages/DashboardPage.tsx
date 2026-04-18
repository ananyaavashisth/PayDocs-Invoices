import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Plus, FileText, Search, Filter, Loader2, AlertCircle } from "lucide-react";
import { fetchInvoices } from "../api/invoices";
import { fetchClients } from "../api/clients";
import { centsToDisplay } from "../utils/format";
import type { InvoiceSummary, Client } from "../types";

/**
 * DashboardPage — Shows the list of all invoices and a summary.
 */
export default function DashboardPage() {
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [clients, setClients] = useState<Record<number, Client>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function loadData() {
      try {
        const [invList, clientList] = await Promise.all([
          fetchInvoices(),
          fetchClients(),
        ]);
        
        const clientMap = clientList.reduce((acc, c) => ({ ...acc, [c.id]: c }), {});
        
        setInvoices(invList);
        setClients(clientMap);
      } catch (err) {
        setError("Failed to load dashboard data. Please check if the backend is running.");
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, []);

  // Filter logic
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const clientName = clients[inv.client_id]?.name?.toLowerCase() ?? "";
      const invoiceNumber = inv.invoice_number.toLowerCase();
      const query = searchTerm.toLowerCase();
      
      const matchesSearch = clientName.includes(query) || invoiceNumber.includes(query);
      
      // Compute effective status for filtering
      const isOverdue = inv.status !== "paid" && new Date(inv.due_date) < new Date(new Date().setHours(0,0,0,0));
      const effectiveStatus = isOverdue ? "overdue" : inv.status;
      
      const matchesStatus = statusFilter === "all" || effectiveStatus === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [invoices, clients, searchTerm, statusFilter]);

  // Status Badge Component
  const StatusBadge = ({ status, dueDate }: { status: string; dueDate: string }) => {
    // Determine if overdue: not paid and dueDate < today
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

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
        <p className="mt-4 text-surface-500">Loading your invoices...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Header Area */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-surface-900">Invoices</h1>
          <p className="mt-1 text-surface-500">Manage and track your business billing.</p>
        </div>
        <Link
          to="/invoices/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
        >
          <Plus className="h-4 w-4" />
          New Invoice
        </Link>
      </div>

      {error && (
        <div className="mt-8 flex items-center gap-3 rounded-xl border border-danger/20 bg-red-50 p-4 text-danger">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Main Table Area */}
      <div className="mt-8 rounded-xl border border-surface-200 bg-white shadow-sm overflow-hidden">
        {/* Table Controls */}
        <div className="flex items-center gap-4 border-b border-surface-100 bg-surface-50/50 px-6 py-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder="Search by invoice # or client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-surface-200 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-surface-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm font-medium text-surface-700 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 transition-all"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* The Table */}
        <div className="overflow-x-auto">
          {filteredInvoices.length > 0 ? (
            <table className="w-full text-left">
              <thead className="border-b border-surface-100 bg-surface-50/50">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-surface-500 text-nowrap">Invoice</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-surface-500 text-nowrap">Client</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-surface-500 text-nowrap">Date</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-surface-500 text-nowrap">Amount</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-surface-500 text-nowrap">Status</th>
                  <th className="px-6 py-4 text-right" aria-label="Actions" />
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="group hover:bg-surface-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-dark">
                          <FileText className="h-5 w-5 text-primary-600" />
                        </div>
                        <span className="font-semibold text-surface-900">{invoice.invoice_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-surface-900">
                          {clients[invoice.client_id]?.name || `Client #${invoice.client_id}`}
                        </span>
                        <span className="text-xs text-surface-500">
                          {clients[invoice.client_id]?.email || ""}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-surface-600">
                      {new Date(invoice.issue_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-surface-900">
                      {centsToDisplay(invoice.total_amount, invoice.currency)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={invoice.status} dueDate={invoice.due_date} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/invoices/${invoice.id}`}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-50 text-surface-300">
                <FileText className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-surface-900">No invoices yet</h3>
              <p className="mt-1 text-surface-500">Get started by creating your first invoice.</p>
              <Link to="/invoices/new" className="mt-6 text-sm font-semibold text-primary-600 hover:text-primary-700">
                Create new invoice →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
