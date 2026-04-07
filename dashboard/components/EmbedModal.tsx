'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import toast from 'react-hot-toast';

interface EmbedModalProps {
  cameraId: string;
  cameraName: string;
}

export default function EmbedModal({ cameraId, cameraName }: EmbedModalProps) {
  const [embedHtml, setEmbedHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/cameras/${cameraId}/embed`);
      if (!res.ok) throw new Error((await res.json()).error);
      const data = await res.json();
      setEmbedHtml(data.embed_html);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load embed');
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    if (!embedHtml) return;
    navigator.clipboard.writeText(embedHtml);
    toast.success('Embed code copied!');
  }

  return (
    <Dialog.Root onOpenChange={(open) => open && load()}>
      <Dialog.Trigger asChild>
        <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
          Embed
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40" />
        <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-lg shadow-2xl">
          <Dialog.Title className="font-semibold text-gray-100 mb-4">
            Embed — {cameraName}
          </Dialog.Title>
          {loading && <p className="text-sm text-gray-400">Loading…</p>}
          {embedHtml && (
            <>
              <textarea
                readOnly
                value={embedHtml}
                rows={5}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs text-gray-300 font-mono resize-none"
              />
              <button
                onClick={copy}
                className="mt-3 w-full bg-brand hover:bg-brand-dark text-white text-sm font-medium py-2 rounded-lg transition-colors"
              >
                Copy to Clipboard
              </button>
            </>
          )}
          <Dialog.Close asChild>
            <button className="mt-2 w-full text-sm text-gray-500 hover:text-gray-300 transition-colors py-1">
              Close
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
