import React from 'react';
import { Document, Page, Text, View, Image } from '@react-pdf/renderer';
import type { OrcamentoData } from './types';

const CM = 28.346;

const C = {
  dark:   '#1a1a2e',
  gray:   '#d0d0d0',
  light:  '#f5f5f5',
  mid:    '#555555',
  border: '#cccccc',
  white:  '#ffffff',
} as const;

const W = {
  scope: [5.5 * CM, 11.5 * CM] as const,
  apf:   [10.7 * CM, 2.3 * CM, 2.5 * CM, 1.5 * CM] as const,
  val:   [8.2 * CM, 2.3 * CM, 2.5 * CM, 4.0 * CM] as const,
};

const cellBase = {
  padding: 4,
  borderRightWidth: 0.3,
  borderRightColor: C.border,
  borderRightStyle: 'solid' as const,
  borderBottomWidth: 0.3,
  borderBottomColor: C.border,
  borderBottomStyle: 'solid' as const,
};

const tableWrap = {
  borderLeftWidth: 0.3,
  borderLeftColor: C.border,
  borderLeftStyle: 'solid' as const,
  borderTopWidth: 0.3,
  borderTopColor: C.border,
  borderTopStyle: 'solid' as const,
};

function brl(v: number): string {
  const [int, dec] = v.toFixed(2).split('.');
  return 'R$ ' + int.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + dec;
}

interface CellProps {
  w: number;
  text: string;
  bold?: boolean;
  align?: 'left' | 'center' | 'right';
}

function Cell({ w, text, bold = false, align = 'left' }: CellProps) {
  return (
    <View style={{ ...cellBase, width: w }}>
      <Text style={{
        fontSize: 8,
        fontFamily: bold ? 'Helvetica-Bold' : 'Helvetica',
        textAlign: align,
        color: '#333333',
      }}>
        {text}
      </Text>
    </View>
  );
}

const sectionTitle = {
  fontFamily: 'Helvetica-Bold' as const,
  fontSize: 8.5,
  color: C.dark,
  marginTop: 8,
  marginBottom: 4,
};

export default function OrcamentoPDF({ data }: { data: OrcamentoData }) {
  const {
    titulo, consultor, rodapeTexto,
    circleLogoUrl, entangleLogoUrl,
    escopo, apf, valores,
    nfPercentual, bvPercentual,
  } = data;

  const subtotal = valores.reduce((s, v) => s + v.valorHora * v.pontos, 0);
  const nf       = subtotal * (nfPercentual / 100);
  const baseBV   = subtotal + nf;
  const bv       = baseBV * (bvPercentual / 100);
  const total    = baseBV + bv;
  const totalAPF = apf.reduce((s, i) => s + i.pontos, 0);

  return (
    <Document>
      <Page
        size="A4"
        style={{
          fontFamily: 'Helvetica',
          paddingTop: 3.9 * CM,
          paddingBottom: 3.2 * CM,
          paddingHorizontal: 2 * CM,
          backgroundColor: C.white,
        }}
      >
        {/* ── HEADER fixed ── */}
        <View
          fixed
          style={{
            position: 'absolute',
            top: 2.2 * CM,
            left: 2 * CM,
            right: 2 * CM,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
            {circleLogoUrl ? (
              <Image src={circleLogoUrl} style={{ width: 0.9 * CM, height: 0.9 * CM }} />
            ) : null}
            <Text style={{
              fontFamily: 'Helvetica-Bold',
              fontSize: 11,
              color: C.dark,
              marginLeft: circleLogoUrl ? 0.3 * CM : 0,
            }}>
              {consultor || 'Consultor'}
            </Text>
          </View>
          <View style={{ height: 0.5, backgroundColor: C.border }} />
        </View>

        {/* ── FOOTER fixed ── */}
        <View
          fixed
          style={{
            position: 'absolute',
            bottom: 2 * CM,
            left: 2 * CM,
            right: 2 * CM,
            borderTopWidth: 0.5,
            borderTopColor: C.border,
            borderTopStyle: 'solid',
            paddingTop: 4,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {entangleLogoUrl ? (
            <Image
              src={entangleLogoUrl}
              style={{ height: 8, width: 25, marginRight: 5 }}
            />
          ) : null}
          <Text style={{ fontSize: 7, color: C.mid, fontFamily: 'Helvetica' }}>
            {rodapeTexto || consultor}
          </Text>
        </View>

        {/* ── TÍTULO ── */}
        <Text style={{
          fontFamily: 'Helvetica-Bold',
          fontSize: 10,
          color: C.dark,
          textAlign: 'center',
          marginBottom: 8,
        }}>
          {titulo || 'ORÇAMENTO'}
        </Text>

        {/* ── ESCOPO ── */}
        {escopo.length > 0 && (
          <>
            <Text style={sectionTitle}>ESCOPO DO PROJETO</Text>
            <View style={tableWrap}>
              <View style={{ flexDirection: 'row', backgroundColor: C.gray }}>
                <Cell w={W.scope[0]} text="Funcionalidade" bold />
                <Cell w={W.scope[1]} text="Descrição" bold />
              </View>
              {escopo.map((item, i) => (
                <View key={item.id} style={{ flexDirection: 'row', backgroundColor: i % 2 === 0 ? C.white : C.light }}>
                  <Cell w={W.scope[0]} text={item.funcionalidade} />
                  <Cell w={W.scope[1]} text={item.descricao} />
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── APF ── */}
        {apf.length > 0 && (
          <>
            <Text style={sectionTitle}>ANÁLISE DE PONTOS POR FUNÇÃO</Text>
            <View style={tableWrap}>
              <View style={{ flexDirection: 'row', backgroundColor: C.gray }}>
                <Cell w={W.apf[0]} text="Funcionalidade" bold />
                <Cell w={W.apf[1]} text="Tipo" bold align="center" />
                <Cell w={W.apf[2]} text="Complexidade" bold align="center" />
                <Cell w={W.apf[3]} text="Pts" bold align="center" />
              </View>
              {apf.map((item, i) => (
                <View key={item.id} style={{ flexDirection: 'row', backgroundColor: i % 2 === 0 ? C.white : C.light }}>
                  <Cell w={W.apf[0]} text={item.funcionalidade} />
                  <Cell w={W.apf[1]} text={item.tipo} align="center" />
                  <Cell w={W.apf[2]} text={item.complexidade} align="center" />
                  <Cell w={W.apf[3]} text={String(item.pontos)} align="center" />
                </View>
              ))}
              <View style={{ flexDirection: 'row', backgroundColor: C.gray }}>
                <Cell w={W.apf[0]} text="TOTAL" bold />
                <Cell w={W.apf[1]} text="" align="center" />
                <Cell w={W.apf[2]} text="" align="center" />
                <Cell w={W.apf[3]} text={String(totalAPF)} bold align="center" />
              </View>
            </View>
          </>
        )}

        {/* ── VALORES ── */}
        {valores.length > 0 && (
          <>
            <Text style={sectionTitle}>COMPOSIÇÃO DE VALORES</Text>
            <View style={tableWrap}>
              <View style={{ flexDirection: 'row', backgroundColor: C.gray }}>
                <Cell w={W.val[0]} text="Categoria" bold />
                <Cell w={W.val[1]} text="Valor/Hora" bold align="right" />
                <Cell w={W.val[2]} text="Pontos" bold align="right" />
                <Cell w={W.val[3]} text="Valor Total" bold align="right" />
              </View>
              {valores.map((item, i) => (
                <View key={item.id} style={{ flexDirection: 'row', backgroundColor: i % 2 === 0 ? C.white : C.light }}>
                  <Cell w={W.val[0]} text={item.descricao} />
                  <Cell w={W.val[1]} text={brl(item.valorHora)} align="right" />
                  <Cell w={W.val[2]} text={String(item.pontos)} align="right" />
                  <Cell w={W.val[3]} text={brl(item.valorHora * item.pontos)} align="right" />
                </View>
              ))}
              <View style={{ flexDirection: 'row', backgroundColor: C.white }}>
                <Cell w={W.val[0]} text="Subtotal" bold />
                <Cell w={W.val[1]} text="" align="right" />
                <Cell w={W.val[2]} text="" align="right" />
                <Cell w={W.val[3]} text={brl(subtotal)} bold align="right" />
              </View>
              <View style={{ flexDirection: 'row', backgroundColor: C.light }}>
                <Cell w={W.val[0]} text={`Emissão de NF (${nfPercentual}%)`} />
                <Cell w={W.val[1]} text="" align="right" />
                <Cell w={W.val[2]} text="" align="right" />
                <Cell w={W.val[3]} text={brl(nf)} align="right" />
              </View>
              <View style={{ flexDirection: 'row', backgroundColor: C.white }}>
                <Cell w={W.val[0]} text={`BV (${bvPercentual}%)`} bold />
                <Cell w={W.val[1]} text="" align="right" />
                <Cell w={W.val[2]} text="" align="right" />
                <Cell w={W.val[3]} text={brl(bv)} bold align="right" />
              </View>
            </View>
          </>
        )}

        {/* ── TOTAL ── */}
        <View style={{
          flexDirection: 'row',
          backgroundColor: C.dark,
          marginTop: 6,
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: 9,
          paddingHorizontal: 10,
        }}>
          <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 11, color: C.white }}>
            INVESTIMENTO TOTAL
          </Text>
          <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 11, color: C.white }}>
            {brl(total)}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
