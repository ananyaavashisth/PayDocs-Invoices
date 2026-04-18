import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { createBusiness } from "../api/businesses";
import { createClient } from "../api/clients";

// Shared classes
const INPUT_CLASS = "w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-colors";
const LABEL_CLASS = "block text-sm font-medium text-surface-700 mb-1";

interface QuickAddProps {
  onSuccess: (id: number) => void;
  onCancel: () => void;
}

/**
 * Form to add a new Business quickly.
 */
export function BusinessQuickAdd({ onSuccess, onCancel }: QuickAddProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    console.log("Sending business:", { name, address });
    try {
      const res = await createBusiness({ name, address });
      onSuccess(res.id);
    } catch (err) {
      console.error(err);
      alert("Failed to create business.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={LABEL_CLASS}>Business Name</label>
        <input 
          required 
          className={INPUT_CLASS} 
          value={name} 
          onChange={e => setName(e.target.value)} 
          placeholder="e.g. Acme Corp"
        />
      </div>
      <div>
        <label className={LABEL_CLASS}>Address</label>
        <textarea 
          required 
          className={INPUT_CLASS} 
          rows={3} 
          value={address} 
          onChange={e => setAddress(e.target.value)} 
          placeholder="Full business address..."
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-surface-500 hover:text-surface-700">Cancel</button>
        <button 
          type="submit" 
          disabled={submitting}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Business
        </button>
      </div>
    </form>
  );
}

/**
 * Form to add a new Client quickly.
 */
export function ClientQuickAdd({ onSuccess, onCancel }: QuickAddProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    console.log("Sending client:", { name, email, address });
    try {
      const res = await createClient({ name, email, address });
      onSuccess(res.id);
    } catch (err) {
      console.error(err);
      alert("Failed to create client.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={LABEL_CLASS}>Client Name</label>
        <input 
          required 
          className={INPUT_CLASS} 
          value={name} 
          onChange={e => setName(e.target.value)} 
          placeholder="Client or Company name"
        />
      </div>
      <div>
        <label className={LABEL_CLASS}>Email Address</label>
        <input 
          required 
          type="email" 
          className={INPUT_CLASS} 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          placeholder="billing@client.com"
        />
      </div>
      <div>
        <label className={LABEL_CLASS}>Billing Address</label>
        <textarea 
          required 
          className={INPUT_CLASS} 
          rows={2} 
          value={address} 
          onChange={e => setAddress(e.target.value)} 
          placeholder="Client billing address..."
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-surface-500 hover:text-surface-700">Cancel</button>
        <button 
          type="submit" 
          disabled={submitting}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Client
        </button>
      </div>
    </form>
  );
}
