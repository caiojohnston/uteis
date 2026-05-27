'use client';

import { useEffect, useRef, useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import OrcamentoPDF from './OrcamentoPDF';
import type { OrcamentoData } from './types';

export default function PDFPreview({ data }: { data: OrcamentoData }) {
  const [url, setUrl]       = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const prevUrl = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    pdf(<OrcamentoPDF data={data} />)
      .toBlob()
      .then(blob => {
        if (cancelled) return;
        const next = URL.createObjectURL(blob);
        if (prevUrl.current) URL.revokeObjectURL(prevUrl.current);
        prevUrl.current = next;
        setUrl(next);
        setLoading(false);
      })
      .catch(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [data]);

  useEffect(() => {
    return () => { if (prevUrl.current) URL.revokeObjectURL(prevUrl.current); };
  }, []);

  return (
    <div className="space-y-3">
      <div className="relative w-full border border-ink-border bg-ink-surface" style={{ height: 720 }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-xs text-paper/30 animate-pulse">Gerando PDF…</span>
          </div>
        )}
        {url && !loading && (
          <iframe
            src={`${url}#toolbar=0&navpanes=0&scrollbar=1`}
            className="w-full h-full"
            title="Preview do orçamento"
          />
        )}
      </div>

      <a
        href={url ?? '#'}
        download="orcamento.pdf"
        className={[
          'block w-full py-3 text-center text-sm font-mono transition-colors',
          url
            ? 'bg-gold text-ink hover:bg-gold/80 cursor-pointer'
            : 'bg-gold/30 text-ink/40 cursor-not-allowed pointer-events-none',
        ].join(' ')}
      >
        Baixar PDF
      </a>
    </div>
  );
}
