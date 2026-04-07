'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function ProvisionForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    id: '',
    name: '',
    client: '',
    yt_key: '',
    yt_url: '',
    destination: 'youtube',
    notes: '',
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.id || !form.name || !form.client) {
      toast.error('Camera ID, name, and client are required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/cameras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Camera ${form.id} provisioned!`);
      router.push(`/cameras/${form.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to provision camera');
    } finally {
      setLoading(false);
    }
  }

  const inputCls = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-brand';

  return (
    <form onSubmit={submit} className="space-y-4 max-w-lg">
      <div>
        <label className="block text-xs text-gray-400 mb-1">Device ID <span className="text-red-400">*</span></label>
        <input
          className={inputCls}
          placeholder="YNLED0001"
          value={form.id}
          onChange={(e) => set('id', e.target.value.toUpperCase())}
          pattern="YNLED\d{4}"
          title="Format: YNLED followed by 4 digits (e.g. YNLED0001)"
          required
        />
        <p className="text-xs text-gray-600 mt-1">Format: YNLED0001 — YNLED9999. Must match what you set on the camera.</p>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">Camera Name <span className="text-red-400">*</span></label>
        <input className={inputCls} placeholder="Front Entrance" value={form.name} onChange={(e) => set('name', e.target.value)} required />
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">Client <span className="text-red-400">*</span></label>
        <input className={inputCls} placeholder="Margate Boardwalk" value={form.client} onChange={(e) => set('client', e.target.value)} required />
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">YouTube Stream Key</label>
        <input className={inputCls} placeholder="xxxx-xxxx-xxxx-xxxx" value={form.yt_key} onChange={(e) => set('yt_key', e.target.value)} />
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">YouTube Watch URL</label>
        <input className={inputCls} placeholder="https://www.youtube.com/watch?v=..." value={form.yt_url} onChange={(e) => set('yt_url', e.target.value)} type="url" />
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">Destination</label>
        <select className={inputCls} value={form.destination} onChange={(e) => set('destination', e.target.value)}>
          <option value="youtube">YouTube (public stream)</option>
          <option value="private">Private (unlisted)</option>
          <option value="both">Both</option>
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">Notes</label>
        <textarea className={inputCls} rows={2} placeholder="Optional notes..." value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
      >
        {loading ? 'Provisioning…' : 'Provision Camera'}
      </button>
    </form>
  );
}
