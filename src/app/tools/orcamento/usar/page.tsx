'use client';

import { useState, useCallback, useId } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { OrcamentoData, EscopoItem, APFItem, APFTipo, APFComplexidade, ValorItem } from './types';

const PDFPreview = dynamic(() => import('./PDFPreview'), {
  ssr: false,
  loading: () => (
    <div className="w-full border border-ink-border bg-ink-surface flex items-center justify-center" style={{ height: 720 }}>
      <span className="font-mono text-xs text-paper/30">Carregando…</span>
    </div>
  ),
});

// ── IFPUG standard points ──
const APF_PTS: Record<APFTipo, Record<APFComplexidade, number>> = {
  ALI: { Baixa: 7,  Média: 10, Alta: 15 },
  AIE: { Baixa: 5,  Média: 7,  Alta: 10 },
  EE:  { Baixa: 3,  Média: 4,  Alta: 6  },
  SE:  { Baixa: 4,  Média: 5,  Alta: 7  },
  CE:  { Baixa: 3,  Média: 4,  Alta: 6  },
};

const uid = () => Math.random().toString(36).slice(2);

const BLANK: OrcamentoData = {
  titulo:          '',
  consultor:       '',
  rodapeTexto:     '',
  circleLogoUrl:   null,
  entangleLogoUrl: null,
  escopo:          [],
  apf:             [],
  valores:         [],
  nfPercentual:    5,
  bvPercentual:    20,
};

// ── Shared input class ──
const inp = 'w-full bg-ink-surface border border-ink-border text-paper/80 font-mono text-xs px-3 py-2 focus:outline-none focus:border-gold/60 placeholder:text-paper/20';
const sel = inp + ' cursor-pointer';
const btn = 'text-xs font-mono px-3 py-1.5 border border-ink-border text-paper/40 hover:text-paper/70 hover:border-gold/40 transition-colors';

// ── Accordion section ──
function Section({ title, open, onToggle, children }: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-ink-border">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-ink-surface/50 transition-colors"
        onClick={onToggle}
      >
        <span className="text-xs font-mono text-paper/60 tracking-widest uppercase">{title}</span>
        <span className="text-paper/30 font-mono text-sm">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="px-4 pb-4 pt-2 space-y-3">{children}</div>}
    </div>
  );
}

// ── BRL formatter ──
function brl(v: number) {
  const [int, dec] = v.toFixed(2).split('.');
  return 'R$ ' + int.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + dec;
}

// ── Logo upload ──
function LogoInput({ label, value, onChange }: {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const id = useId();

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onChange(ev.target?.result as string ?? null);
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-xs font-mono text-paper/30">{label}</label>
      <div className="flex items-center gap-3">
        <label
          htmlFor={id}
          className="cursor-pointer text-xs font-mono px-3 py-1.5 border border-ink-border text-paper/50 hover:border-gold/40 hover:text-paper/70 transition-colors"
        >
          {value ? 'Trocar imagem' : 'Escolher imagem'}
        </label>
        <input id={id} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        {value && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="h-8 w-auto object-contain border border-ink-border p-0.5 bg-paper/5" />
            <button type="button" className="text-paper/30 hover:text-paper/60 font-mono text-xs" onClick={() => onChange(null)}>×</button>
          </>
        )}
        {!value && <span className="text-xs font-mono text-paper/20">nenhuma</span>}
      </div>
    </div>
  );
}

export default function OrcamentoPage() {
  const [form, setForm]       = useState<OrcamentoData>(BLANK);
  const [pdfData, setPdfData] = useState<OrcamentoData | null>(null);
  const [open, setOpen]       = useState({
    info:   true,
    logos:  true,
    escopo: true,
    apf:    true,
    val:    true,
  });

  const toggle = (k: keyof typeof open) =>
    setOpen(s => ({ ...s, [k]: !s[k] }));

  // ── Escopo ──
  const addEscopo = () =>
    setForm(f => ({ ...f, escopo: [...f.escopo, { id: uid(), funcionalidade: '', descricao: '' }] }));

  const updEscopo = useCallback((id: string, field: keyof EscopoItem, val: string) =>
    setForm(f => ({ ...f, escopo: f.escopo.map(r => r.id === id ? { ...r, [field]: val } : r) })), []);

  const delEscopo = useCallback((id: string) =>
    setForm(f => ({ ...f, escopo: f.escopo.filter(r => r.id !== id) })), []);

  // ── APF ──
  const addAPF = () =>
    setForm(f => ({
      ...f,
      apf: [...f.apf, { id: uid(), funcionalidade: '', tipo: 'EE', complexidade: 'Baixa', pontos: 3 }],
    }));

  const updAPF = useCallback((id: string, field: keyof APFItem, val: string | number) =>
    setForm(f => ({
      ...f,
      apf: f.apf.map(r => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: val };
        // auto-fill pontos when tipo or complexidade changes
        if (field === 'tipo' || field === 'complexidade') {
          const t = field === 'tipo' ? (val as APFTipo) : r.tipo;
          const c = field === 'complexidade' ? (val as APFComplexidade) : r.complexidade;
          updated.pontos = APF_PTS[t][c];
        }
        return updated;
      }),
    })), []);

  const delAPF = useCallback((id: string) =>
    setForm(f => ({ ...f, apf: f.apf.filter(r => r.id !== id) })), []);

  // ── Valores ──
  const addValor = () =>
    setForm(f => ({ ...f, valores: [...f.valores, { id: uid(), descricao: '', valorHora: 0, pontos: 0 }] }));

  const updValor = useCallback((id: string, field: keyof ValorItem, val: string | number) =>
    setForm(f => ({ ...f, valores: f.valores.map(r => r.id === id ? { ...r, [field]: val } : r) })), []);

  const delValor = useCallback((id: string) =>
    setForm(f => ({ ...f, valores: f.valores.filter(r => r.id !== id) })), []);

  // ── Derived totals ──
  const subtotal  = form.valores.reduce((s, v) => s + v.valorHora * v.pontos, 0);
  const nfVal     = subtotal * (form.nfPercentual / 100);
  const baseBV    = subtotal + nfVal;
  const bvVal     = baseBV * (form.bvPercentual / 100);
  const totalVal  = baseBV + bvVal;
  const totalAPF  = form.apf.reduce((s, i) => s + i.pontos, 0);

  // ── Generate PDF ──
  function generate() {
    setPdfData({ ...form });
  }

  const labelCls = 'block text-xs font-mono text-paper/30 mb-1';

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <Link
        href="/tools/orcamento"
        className="inline-flex items-center gap-2 text-xs font-mono text-paper/30 hover:text-gold transition-colors"
      >
        ← Gerador de Orçamento
      </Link>

      <span className="gold-rule block my-8" />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* ── FORM ── */}
        <div className="space-y-3">

          {/* 1 · Info */}
          <Section title="Informações Básicas" open={open.info} onToggle={() => toggle('info')}>
            <div>
              <label className={labelCls}>Título do Orçamento</label>
              <input className={inp} value={form.titulo} placeholder="ORÇAMENTO – NOME DO PROJETO"
                onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Nome do Consultor</label>
              <input className={inp} value={form.consultor} placeholder="Nome do Consultor"
                onChange={e => setForm(f => ({ ...f, consultor: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Texto do Rodapé</label>
              <input className={inp} value={form.rodapeTexto} placeholder="Nome, Cargo ou Empresa"
                onChange={e => setForm(f => ({ ...f, rodapeTexto: e.target.value }))} />
            </div>
          </Section>

          {/* 2 · Logos */}
          <Section title="Logos" open={open.logos} onToggle={() => toggle('logos')}>
            <LogoInput
              label="Logo do Header"
              value={form.circleLogoUrl}
              onChange={url => setForm(f => ({ ...f, circleLogoUrl: url }))}
            />
            <LogoInput
              label="Logo do Rodapé"
              value={form.entangleLogoUrl}
              onChange={url => setForm(f => ({ ...f, entangleLogoUrl: url }))}
            />
          </Section>

          {/* 3 · Escopo */}
          <Section title="Escopo do Projeto" open={open.escopo} onToggle={() => toggle('escopo')}>
            {form.escopo.length === 0 ? (
              <p className="text-xs font-mono text-paper/20">Nenhum item. Clique em + para adicionar.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs font-mono">
                  <thead>
                    <tr className="text-paper/30">
                      <th className="text-left pb-2 pr-2 font-normal w-2/5">Funcionalidade</th>
                      <th className="text-left pb-2 pr-2 font-normal">Descrição</th>
                      <th className="pb-2 w-6" />
                    </tr>
                  </thead>
                  <tbody className="space-y-1">
                    {form.escopo.map(r => (
                      <tr key={r.id}>
                        <td className="pr-2 pb-2">
                          <input className={inp} value={r.funcionalidade}
                            placeholder="Funcionalidade"
                            onChange={e => updEscopo(r.id, 'funcionalidade', e.target.value)} />
                        </td>
                        <td className="pr-2 pb-2">
                          <input className={inp} value={r.descricao}
                            placeholder="Descrição"
                            onChange={e => updEscopo(r.id, 'descricao', e.target.value)} />
                        </td>
                        <td className="pb-2">
                          <button type="button" className="text-paper/20 hover:text-paper/60 font-mono px-1"
                            onClick={() => delEscopo(r.id)}>×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <button type="button" className={btn} onClick={addEscopo}>+ Adicionar item</button>
          </Section>

          {/* 4 · APF */}
          <Section title={`APF — ${totalAPF} pontos`} open={open.apf} onToggle={() => toggle('apf')}>
            {form.apf.length === 0 ? (
              <p className="text-xs font-mono text-paper/20">Nenhum item. Clique em + para adicionar.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs font-mono">
                  <thead>
                    <tr className="text-paper/30">
                      <th className="text-left pb-2 pr-2 font-normal">Funcionalidade</th>
                      <th className="text-left pb-2 pr-2 font-normal w-16">Tipo</th>
                      <th className="text-left pb-2 pr-2 font-normal w-24">Complexidade</th>
                      <th className="text-left pb-2 pr-2 font-normal w-16">Pts</th>
                      <th className="pb-2 w-6" />
                    </tr>
                  </thead>
                  <tbody>
                    {form.apf.map(r => (
                      <tr key={r.id}>
                        <td className="pr-2 pb-2">
                          <input className={inp} value={r.funcionalidade}
                            placeholder="Funcionalidade"
                            onChange={e => updAPF(r.id, 'funcionalidade', e.target.value)} />
                        </td>
                        <td className="pr-2 pb-2">
                          <select className={sel} value={r.tipo}
                            onChange={e => updAPF(r.id, 'tipo', e.target.value as APFTipo)}>
                            {(['ALI','AIE','EE','SE','CE'] as APFTipo[]).map(t => (
                              <option key={t}>{t}</option>
                            ))}
                          </select>
                        </td>
                        <td className="pr-2 pb-2">
                          <select className={sel} value={r.complexidade}
                            onChange={e => updAPF(r.id, 'complexidade', e.target.value as APFComplexidade)}>
                            {(['Baixa','Média','Alta'] as APFComplexidade[]).map(c => (
                              <option key={c}>{c}</option>
                            ))}
                          </select>
                        </td>
                        <td className="pr-2 pb-2">
                          <input type="number" className={inp} value={r.pontos} min={0}
                            onChange={e => updAPF(r.id, 'pontos', Number(e.target.value))} />
                        </td>
                        <td className="pb-2">
                          <button type="button" className="text-paper/20 hover:text-paper/60 font-mono px-1"
                            onClick={() => delAPF(r.id)}>×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <button type="button" className={btn} onClick={addAPF}>+ Adicionar item</button>
          </Section>

          {/* 5 · Valores */}
          <Section title="Composição de Valores" open={open.val} onToggle={() => toggle('val')}>
            {form.valores.length === 0 ? (
              <p className="text-xs font-mono text-paper/20">Nenhum item. Clique em + para adicionar.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs font-mono">
                  <thead>
                    <tr className="text-paper/30">
                      <th className="text-left pb-2 pr-2 font-normal">Categoria</th>
                      <th className="text-left pb-2 pr-2 font-normal w-24">R$/hora</th>
                      <th className="text-left pb-2 pr-2 font-normal w-16">Pontos</th>
                      <th className="text-right pb-2 pr-2 font-normal w-28">Total</th>
                      <th className="pb-2 w-6" />
                    </tr>
                  </thead>
                  <tbody>
                    {form.valores.map(r => (
                      <tr key={r.id}>
                        <td className="pr-2 pb-2">
                          <input className={inp} value={r.descricao}
                            placeholder="Categoria"
                            onChange={e => updValor(r.id, 'descricao', e.target.value)} />
                        </td>
                        <td className="pr-2 pb-2">
                          <input type="number" className={inp} value={r.valorHora} min={0}
                            onChange={e => updValor(r.id, 'valorHora', Number(e.target.value))} />
                        </td>
                        <td className="pr-2 pb-2">
                          <input type="number" className={inp} value={r.pontos} min={0}
                            onChange={e => updValor(r.id, 'pontos', Number(e.target.value))} />
                        </td>
                        <td className="pr-2 pb-2 text-right text-paper/50">
                          {brl(r.valorHora * r.pontos)}
                        </td>
                        <td className="pb-2">
                          <button type="button" className="text-paper/20 hover:text-paper/60 font-mono px-1"
                            onClick={() => delValor(r.id)}>×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <button type="button" className={btn} onClick={addValor}>+ Adicionar item</button>

            {/* Percentuais + resumo */}
            {form.valores.length > 0 && (
              <div className="mt-4 space-y-3 border-t border-ink-border pt-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className={labelCls}>NF (%)</label>
                    <input type="number" className={inp} value={form.nfPercentual} min={0} max={100}
                      onChange={e => setForm(f => ({ ...f, nfPercentual: Number(e.target.value) }))} />
                  </div>
                  <div className="flex-1">
                    <label className={labelCls}>BV (%)</label>
                    <input type="number" className={inp} value={form.bvPercentual} min={0} max={100}
                      onChange={e => setForm(f => ({ ...f, bvPercentual: Number(e.target.value) }))} />
                  </div>
                </div>

                <div className="text-xs font-mono space-y-1 text-paper/50">
                  <div className="flex justify-between">
                    <span>Subtotal</span><span>{brl(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>NF ({form.nfPercentual}%)</span><span>{brl(nfVal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>BV ({form.bvPercentual}%)</span><span>{brl(bvVal)}</span>
                  </div>
                  <div className="flex justify-between text-paper/80 border-t border-ink-border pt-1 font-bold">
                    <span>TOTAL</span><span>{brl(totalVal)}</span>
                  </div>
                </div>
              </div>
            )}
          </Section>

          {/* Generate button */}
          <button
            type="button"
            onClick={generate}
            disabled={!form.titulo && !form.consultor}
            className={[
              'w-full py-3 text-sm font-mono transition-colors',
              form.titulo || form.consultor
                ? 'bg-gold text-ink hover:bg-gold/80'
                : 'bg-gold/30 text-ink/40 cursor-not-allowed',
            ].join(' ')}
          >
            Gerar Preview
          </button>
        </div>

        {/* ── PREVIEW ── */}
        <div className="xl:sticky xl:top-8">
          {pdfData ? (
            <PDFPreview data={pdfData} />
          ) : (
            <div className="w-full border border-ink-border bg-ink-surface flex flex-col items-center justify-center gap-3" style={{ height: 720 }}>
              <span className="font-mono text-xs text-paper/20">Preencha o formulário</span>
              <span className="font-mono text-xs text-paper/10">e clique em "Gerar Preview"</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
