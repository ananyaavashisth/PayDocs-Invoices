import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { Plus, Trash2, Loader2, AlertCircle, Globe } from "lucide-react";

import { createInvoice } from "../api/invoices";
import { fetchBusinesses } from "../api/businesses";
import { fetchClients } from "../api/clients";
import { formatCurrency } from "../utils/format";
import Modal from "./Modal";
import { BusinessQuickAdd, ClientQuickAdd } from "./QuickAddForms";
import type { Business, Client, ApiValidationError } from "../types";

// ---------------------------------------------------------------------------
// Form-specific types
// ---------------------------------------------------------------------------

interface LineItemForm {
  id: string;
  description: string;
  quantity: string;
  unit_price: string;
}

interface InvoiceFormData {
  business_id: string;
  client_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  tax_rate: string;
  currency: "USD" | "INR";
  items: LineItemForm[];
}

function createEmptyItem(): LineItemForm {
  return {
    id: crypto.randomUUID(),
    description: "",
    quantity: "",
    unit_price: "",
  };
}

const today = new Date().toISOString().split("T")[0] ?? "";

function getInitialFormData(): InvoiceFormData {
  return {
    business_id: "",
    client_id: "",
    invoice_number: "",
    issue_date: today,
    due_date: "",
    tax_rate: "0",
    currency: "USD",
    items: [createEmptyItem()],
  };
}

const INPUT_CLASS =
  "w-full rounded-lg border border-surface-300 bg-white px-3 py-2.5 text-sm " +
  "text-surface-800 placeholder:text-surface-400 " +
  "focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-colors";

const LABEL_CLASS = "block text-sm font-medium text-surface-700 mb-1.5";

export default function InvoiceForm() {
  const navigate = useNavigate();

  // ----- Form state -----
  const [form, setForm] = useState<InvoiceFormData>(getInitialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ----- Modals state -----
  const [activeModal, setActiveModal] = useState<"business" | "client" | null>(null);

  // ----- Reference data -----
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingRef, setLoadingRef] = useState(true);

  const loadReferenceData = async () => {
    try {
      const [bizList, clientList] = await Promise.all([
        fetchBusinesses(),
        fetchClients(),
      ]);
      setBusinesses(bizList);
      setClients(clientList);
    } catch {
      setError("Failed to load businesses and clients.");
    } finally {
      setLoadingRef(false);
    }
  };

  useEffect(() => {
    void loadReferenceData();
  }, []);

  // ----- Handlers -----

  function updateField<K extends keyof InvoiceFormData>(field: K, value: InvoiceFormData[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateItem(id: string, field: keyof Omit<LineItemForm, "id">, value: string) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  }

  function addItem() {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, createEmptyItem()],
    }));
  }

  function removeItem(id: string) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.length > 1 ? prev.items.filter((i) => i.id !== id) : prev.items,
    }));
  }

  // Live Summary
  const summary = useMemo(() => {
    let subtotal = 0;
    for (const item of form.items) {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      subtotal += qty * price;
    }
    const taxPercent = parseFloat(form.tax_rate) || 0;
    const tax = subtotal * (taxPercent / 100);
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }, [form.items, form.tax_rate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        business_id: parseInt(form.business_id, 10),
        client_id: parseInt(form.client_id, 10),
        invoice_number: form.invoice_number,
        issue_date: form.issue_date,
        due_date: form.due_date,
        tax_rate: Math.round(parseFloat(form.tax_rate) * 100),
        currency: form.currency,
        items: form.items.map((item) => ({
          description: item.description,
          quantity: parseInt(item.quantity, 10),
          unit_price: Math.round(parseFloat(item.unit_price) * 100),
        })),
      };

      await createInvoice(payload);
      navigate("/");
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 400) {
        const data = err.response.data as ApiValidationError;
        setError(data.details.map((d) => d.msg).join(". "));
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingRef) return <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-500" /></div>;

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4 border border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Currency & Invoice Details */}
      <section className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-surface-900">General Information</h2>
          <div className="flex items-center gap-2 rounded-lg bg-surface-50 p-1 ring-1 ring-surface-200">
             <button 
                type="button"
                onClick={() => updateField("currency", "USD")}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${form.currency === 'USD' ? 'bg-white text-primary-600 shadow-sm' : 'text-surface-500 hover:text-surface-700'}`}
             >
                USD ($)
             </button>
             <button 
                type="button"
                onClick={() => updateField("currency", "INR")}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${form.currency === 'INR' ? 'bg-white text-primary-600 shadow-sm' : 'text-surface-500 hover:text-surface-700'}`}
             >
                INR (₹)
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div>
            <label className={LABEL_CLASS}>Invoice Number</label>
            <input type="text" required value={form.invoice_number} onChange={(e) => updateField("invoice_number", e.target.value)} className={INPUT_CLASS} placeholder="INV-001" />
          </div>
          <div>
            <label className={LABEL_CLASS}>Issue Date</label>
            <input type="date" required value={form.issue_date} onChange={(e) => updateField("issue_date", e.target.value)} className={INPUT_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Due Date</label>
            <input type="date" required value={form.due_date} onChange={(e) => updateField("due_date", e.target.value)} className={INPUT_CLASS} />
          </div>
        </div>
      </section>

      {/* Business & Client */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-surface-200 bg-white p-7 shadow-sm ring-1 ring-surface-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-surface-900 tracking-tight">Business</h2>
            <button 
              type="button" 
              onClick={() => setActiveModal("business")} 
              className="flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-bold text-primary-700 hover:bg-primary-100 transition-all border border-primary-200 shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" /> Add New Business
            </button>
          </div>
          <select 
            required 
            value={form.business_id} 
            onChange={(e) => updateField("business_id", e.target.value)} 
            className={`${INPUT_CLASS} ${!form.business_id ? 'border-primary-300 ring-2 ring-primary-50' : ''}`}
          >
            <option value="">{businesses.length === 0 ? "⚠️ No businesses yet. Click 'Add New' ↑" : "Select Business..."}</option>
            {businesses.map((b) => <option key={b.id} value={b.id.toString()}>{b.name}</option>)}
          </select>
        </section>

        <section className="rounded-xl border border-surface-200 bg-white p-7 shadow-sm ring-1 ring-surface-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-surface-900 tracking-tight">Client</h2>
            <button 
              type="button" 
              onClick={() => setActiveModal("client")} 
              className="flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-bold text-primary-700 hover:bg-primary-100 transition-all border border-primary-200 shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" /> Add New Client
            </button>
          </div>
          <select 
            required 
            value={form.client_id} 
            onChange={(e) => updateField("client_id", e.target.value)} 
            className={`${INPUT_CLASS} ${!form.client_id ? 'border-primary-300 ring-2 ring-primary-50' : ''}`}
          >
            <option value="">{clients.length === 0 ? "⚠️ No clients yet. Click 'Add New' ↑" : "Select Client..."}</option>
            {clients.map((c) => <option key={c.id} value={c.id.toString()}>{c.name}</option>)}
          </select>
        </section>
      </div>

      {/* Items */}
      <section className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-surface-900 mb-6">Line Items</h2>
        <div className="space-y-4">
          <div className="hidden md:grid grid-cols-[1fr_80px_140px_120px_40px] gap-4 px-1 text-xs font-bold text-surface-400 uppercase tracking-wider">
            <span>Description</span>
            <span>Qty</span>
            <span>Unit Price</span>
            <span className="text-right">Amount</span>
            <span />
          </div>
          {form.items.map((item, idx) => (
            <div key={item.id} className="grid grid-cols-1 md:grid-cols-[1fr_80px_140px_120px_40px] gap-4 items-center">
              <input required value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} placeholder="Description..." className={INPUT_CLASS} />
              <input required type="number" min="1" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', e.target.value)} className={INPUT_CLASS} />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 text-xs font-bold">{form.currency === 'INR' ? '₹' : '$'}</span>
                <input required type="number" step="0.01" value={item.unit_price} onChange={e => updateItem(item.id, 'unit_price', e.target.value)} className={`${INPUT_CLASS} pl-7`} />
              </div>
              <div className="text-right font-bold text-surface-700">
                {formatCurrency((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0), form.currency)}
              </div>
              <button type="button" onClick={() => removeItem(item.id)} disabled={form.items.length === 1} className="p-2 text-surface-400 hover:text-red-600 disabled:opacity-0"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          <button type="button" onClick={addItem} className="flex items-center gap-2 text-sm font-bold text-primary-600 hover:text-primary-700 pt-2"><Plus className="h-4 w-4" /> Add Item</button>
        </div>
      </section>

      {/* Summary */}
      <section className="rounded-xl border border-surface-200 bg-white p-8 shadow-sm">
        <div className="ml-auto w-full max-w-xs space-y-4">
          <div className="flex items-center justify-between gap-4">
             <label className="text-sm font-bold text-surface-500 uppercase tracking-wider">Tax Rate (%)</label>
             <input type="number" step="0.01" value={form.tax_rate} onChange={e => updateField("tax_rate", e.target.value)} className="w-24 text-right rounded-lg border border-surface-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500/20 outline-none" />
          </div>
          <div className="space-y-2 pt-4 border-t border-surface-100">
            <div className="flex justify-between text-surface-600"><span className="text-sm">Subtotal</span><span className="font-medium">{formatCurrency(summary.subtotal, form.currency)}</span></div>
            <div className="flex justify-between text-surface-600"><span className="text-sm">Tax ({form.tax_rate}%)</span><span className="font-medium">{formatCurrency(summary.tax, form.currency)}</span></div>
            <div className="flex justify-between pt-4 border-t border-surface-900 text-xl font-black text-surface-900 uppercase">
              <span>Total</span>
              <span>{formatCurrency(summary.total, form.currency)}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-4 pt-4">
        <button type="submit" disabled={submitting} className="rounded-xl bg-primary-600 px-10 py-4 text-sm font-black text-white uppercase tracking-widest shadow-lg hover:bg-primary-700 transition-all disabled:opacity-50">
          {submitting ? "Saving..." : "Create Invoice"}
        </button>
      </div>
    </form>

    <Modal 
      isOpen={activeModal === "business"} 
      onClose={() => setActiveModal(null)}
      title="Quick Add Business"
    >
      <BusinessQuickAdd 
        onCancel={() => setActiveModal(null)}
        onSuccess={async (newId) => {
          // Diagnostic: Confirm we got an ID back
          console.log("Business created with ID:", newId);
          setActiveModal(null);
          
          // Reload the lists from the server
          await loadReferenceData();
          
          // Re-select the new item after a tiny pause to ensure React has rendered the new <option>
          setTimeout(() => {
            updateField("business_id", newId.toString());
          }, 50);
        }}
      />
    </Modal>

    <Modal 
      isOpen={activeModal === "client"} 
      onClose={() => setActiveModal(null)}
      title="Quick Add Client"
    >
      <ClientQuickAdd 
        onCancel={() => setActiveModal(null)}
        onSuccess={async (newId) => {
          console.log("Client created with ID:", newId);
          setActiveModal(null);
          
          await loadReferenceData();
          
          setTimeout(() => {
            updateField("client_id", newId.toString());
          }, 50);
        }}
      />
    </Modal>
    </>
  );
}
