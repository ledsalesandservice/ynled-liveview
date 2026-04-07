'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import type { Client } from '@/lib/types';
import toast from 'react-hot-toast';

interface ClientsResponse {
  clients: Client[];
  total_mrr: number;
}

export default function ClientsPage() {
  const { data, mutate } = useSWR<ClientsResponse>('/api/clients', fetcher);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', contact: '', address: '', plan: 'public', mrr: '' });

  async function addClient(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, mrr: parseFloat(form.mrr) || 0 }),
    });
    if (res.ok) {
      toast.success(`${form.name} added`);
      setForm({ name: '', contact: '', address: '', plan: 'public', mrr: '' });
      setAdding(false);
      mutate();
    } else {
      const err = await res.json();
      toast.error(err.error || 'Failed to add client');
    }
  }

  const inputCls = 'bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-brand';

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-100">Clients</h1>
          {data && (
            <p className="text-sm text-gray-500 mt-0.5">
              {data.clients.length} client{data.clients.length !== 1 ? 's' : ''} · MRR: ${data.total_mrr.toFixed(2)}/mo
            </p>
          )}
        </div>
        <button
          onClick={() => setAdding(!adding)}
          className="bg-brand hover:bg-brand-dark text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Add Client
        </button>
      </div>

      {adding && (
        <form onSubmit={addClient} className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6 grid grid-cols-2 gap-4">
          <input className={inputCls} placeholder="Client name *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <input className={inputCls} placeholder="Contact (name / phone)" value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} />
          <input className={inputCls} placeholder="Address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          <select className={inputCls} value={form.plan} onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}>
            <option value="public">Public LiveCam ($19.99/mo)</option>
            <option value="unlisted">Unlisted LiveCam ($14.99/mo)</option>
            <option value="construction">Construction Cam ($24.99/mo)</option>
            <option value="multi">Multi-Cam Package ($12.99/cam/mo)</option>
          </select>
          <input className={inputCls} placeholder="MRR ($)" type="number" step="0.01" value={form.mrr} onChange={(e) => setForm((f) => ({ ...f, mrr: e.target.value }))} />
          <div className="flex gap-2">
            <button type="submit" className="bg-brand hover:bg-brand-dark text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">Save</button>
            <button type="button" onClick={() => setAdding(false)} className="text-sm text-gray-500 hover:text-gray-300 px-4 py-2">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-xs text-gray-500">
              <th className="text-left px-5 py-3 font-medium">Client</th>
              <th className="text-left px-5 py-3 font-medium">Plan</th>
              <th className="text-left px-5 py-3 font-medium">Cameras</th>
              <th className="text-right px-5 py-3 font-medium">MRR</th>
            </tr>
          </thead>
          <tbody>
            {!data && (
              <tr><td colSpan={4} className="px-5 py-4 text-gray-500">Loading…</td></tr>
            )}
            {data?.clients.map((c) => (
              <tr key={c.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50 transition-colors">
                <td className="px-5 py-3">
                  <div className="font-medium text-gray-100">{c.name}</div>
                  {c.contact && <div className="text-xs text-gray-500">{c.contact}</div>}
                </td>
                <td className="px-5 py-3 text-gray-400 capitalize">{c.plan ?? '—'}</td>
                <td className="px-5 py-3 text-gray-400">{c.camera_count ?? 0}</td>
                <td className="px-5 py-3 text-right text-green-400 font-mono">
                  ${(c.mrr ?? 0).toFixed(2)}
                </td>
              </tr>
            ))}
            {data?.clients.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-4 text-gray-500">No clients yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
