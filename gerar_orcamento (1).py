"""
Gerador de Orçamento PDF — Caio Johnston
=========================================
Dependências:
    pip install reportlab cairosvg pillow

Logos necessárias (SVG ou PNG):
    - etanglecircle.png  → logo circular do header
    - entangle.png       → logo horizontal do footer

Uso:
    1. Edite a seção "CONFIGURAÇÃO DO ORÇAMENTO" abaixo
    2. Execute: python gerar_orcamento.py
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from PIL import Image as PILImage
import os

# ══════════════════════════════════════════════════════════════════
#  CONFIGURAÇÃO DO ORÇAMENTO — edite aqui
# ══════════════════════════════════════════════════════════════════

OUTPUT_PATH   = "orcamento.pdf"
TITULO        = "ORÇAMENTO - SISTEMA WEB DE BOLÃO PARA A COPA DO MUNDO 2026"
NOME_CONSULTOR = "Caio Johnston"
RODAPE_TEXTO  = "Caio Johnston,  Data Science & AI Consultant"

# Caminhos das logos (ajuste se necessário)
CIRCLE_LOGO   = "etanglecircle.png"
ENTANGLE_LOGO = "entangle.png"

# Itens do escopo: (título, descrição)
ESCOPO = [
    ("1. Site único com identidade dinâmica", "Uma URL, visual muda conforme a empresa (Albras ou Hydro)"),
    ("2. Cadastro e palpite por jogo",        "Nome, CPF, planta, placar. Palpite bloqueado após envio."),
    ("3. Regra de limite por planta",         "Máx. 100 palpites por placar por planta por jogo."),
    ("4. Validação de CPF único",             "Um palpite por CPF por jogo."),
    ("5. Painel administrativo",              "Listagem de inscrições e ganhadores por planta e jogo."),
    ("6. Cobertura inicial",                  "3 jogos: 13/06 (NJ), 19/06 (Filadélfia), 24/06 (Miami)."),
]

# Itens da APF: (funcionalidade, tipo, complexidade, pontos)
APF = [
    ("Estrutura base do sistema web",                     "ALI", "Alta",  15),
    ("Banco de Dados",                                    "ALI", "Alta",  15),
    ("Home - Lista de Jogos",                             "EE",  "Baixa",  3),
    ("Formulário de Palpite + Cadastro",                  "EE",  "Baixa",  3),
    ("Validação de CPF único por jogo + bloqueio",        "EE",  "Média",  4),
    ("Lógica de limite 100 palpites por placar/planta",   "EE",  "Alta",   6),
    ("Identidade visual dinâmica (Albras / Hydro)",       "SE",  "Média",  5),
    ("Painel Admin (inscrições + ganhadores por planta)", "CE",  "Média",  6),
    ("Testes e Validação do Sistema",                     "CE",  "Média",  6),
    ("Disponibilidade",                                   "SE",  "Baixa",  4),
]

# Itens de valor: (descrição, valor_hora, pontos)
# Use valor_hora="" e pontos="" para linhas sem esses campos (ex: NF, BV)
ITENS_VALOR = [
    ("Desenvolvimento do Software",  48, 55),
    ("Painel Admin e Validações",    48, 12),
]

# Acréscimos percentuais aplicados em cascata sobre o subtotal
NF_PERCENTUAL = 0.05   # 5% emissão de NF
BV_PERCENTUAL = 0.20   # 20% BV (aplicado sobre subtotal + NF)

# ══════════════════════════════════════════════════════════════════
#  GERAÇÃO DO PDF — não precisa editar abaixo
# ══════════════════════════════════════════════════════════════════

W, H = A4
ML = MR = 2*cm
MT = 2.2*cm
MB = 2*cm

dark        = colors.HexColor('#1a1a2e')
header_gray = colors.HexColor('#d0d0d0')
light_gray  = colors.HexColor('#f5f5f5')
mid         = colors.HexColor('#555555')

_ent = PILImage.open(ENTANGLE_LOGO)
ENTANGLE_RATIO = _ent.width / _ent.height

def on_page(canvas, doc):
    canvas.saveState()

    # ── HEADER ──
    logo_h = 0.9*cm
    logo_y = H - MT - logo_h
    font_size = 11
    text_y = logo_y + (logo_h - font_size * 0.0353*cm) / 2

    canvas.drawImage(CIRCLE_LOGO, ML, logo_y,
                     width=logo_h, height=logo_h, preserveAspectRatio=True, mask='auto')
    canvas.setFont('Helvetica-Bold', font_size)
    canvas.setFillColor(dark)
    canvas.drawString(ML + logo_h + 0.3*cm, text_y, NOME_CONSULTOR)

    canvas.setStrokeColor(colors.HexColor('#cccccc'))
    canvas.setLineWidth(0.5)
    canvas.line(ML, logo_y - 0.2*cm, W - MR, logo_y - 0.2*cm)

    # ── FOOTER ──
    canvas.line(ML, MB + 0.8*cm, W - MR, MB + 0.8*cm)
    footer_logo_h = 0.28*cm
    footer_logo_w = footer_logo_h * ENTANGLE_RATIO
    gap     = 0.2*cm
    canvas.setFont('Helvetica', 7)
    canvas.setFillColor(mid)
    text_w  = canvas.stringWidth(RODAPE_TEXTO, 'Helvetica', 7)
    total_w = footer_logo_w + gap + text_w
    start_x = W / 2 - total_w / 2
    footer_y = MB + 0.22*cm

    canvas.drawImage(ENTANGLE_LOGO, start_x, footer_y,
                     width=footer_logo_w, height=footer_logo_h,
                     preserveAspectRatio=True, mask='auto')
    canvas.drawString(start_x + footer_logo_w + gap, footer_y + 0.02*cm, RODAPE_TEXTO)
    canvas.restoreState()


doc = SimpleDocTemplate(OUTPUT_PATH, pagesize=A4,
                        leftMargin=ML, rightMargin=MR,
                        topMargin=MT + 1.4*cm,
                        bottomMargin=MB + 1.4*cm)

title_s   = ParagraphStyle('ts', fontSize=10, fontName='Helvetica-Bold',
                            alignment=TA_CENTER, spaceAfter=8, textColor=dark)
section_s = ParagraphStyle('ss', fontSize=8.5, fontName='Helvetica-Bold',
                            spaceBefore=8, spaceAfter=4, textColor=dark)
cell   = ParagraphStyle('c',  fontSize=8, fontName='Helvetica')
cell_b = ParagraphStyle('cb', fontSize=8, fontName='Helvetica-Bold')

def p(text, style=None): return Paragraph(text, style or cell)
def pb(text): return Paragraph(f'<b>{text}</b>', cell_b)

PAD = [('TOPPADDING',(0,0),(-1,-1),4), ('BOTTOMPADDING',(0,0),(-1,-1),4),
       ('LEFTPADDING',(0,0),(-1,-1),5), ('RIGHTPADDING',(0,0),(-1,-1),5)]

story = []
story.append(Paragraph(TITULO, title_s))

# ── ESCOPO ──
story.append(Paragraph("ESCOPO DO PROJETO", section_s))
scope_data = [[pb("Funcionalidade"), pb("Descrição")]] + \
             [[func, desc] for func, desc in ESCOPO]
t = Table(scope_data, colWidths=[5.5*cm, 11.5*cm])
t.setStyle(TableStyle([
    ('BACKGROUND',(0,0),(-1,0), header_gray),
    ('FONTSIZE',(0,0),(-1,-1), 8),
    ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white, light_gray]),
    ('GRID',(0,0),(-1,-1), 0.3, colors.HexColor('#cccccc')),
    ('VALIGN',(0,0),(-1,-1),'TOP'),
] + PAD))
story.append(t)

# ── APF ──
story.append(Paragraph("ANÁLISE DE PONTOS POR FUNÇÃO", section_s))
total_pts = sum(pts for _, _, _, pts in APF)
fp_data = [[pb("Funcionalidade"), pb("Tipo"), pb("Complexidade"), pb("Pts")]] + \
          [[func, tipo, comp, str(pts)] for func, tipo, comp, pts in APF] + \
          [[pb("TOTAL"), "", "", pb(str(total_pts))]]
fp = Table(fp_data, colWidths=[10.7*cm, 2.3*cm, 2.5*cm, 1.5*cm])
fp.setStyle(TableStyle([
    ('BACKGROUND',(0,0),(-1,0), header_gray),
    ('FONTSIZE',(0,0),(-1,-1), 8),
    ('ROWBACKGROUNDS',(0,1),(-1,-2),[colors.white, light_gray]),
    ('BACKGROUND',(0,-1),(-1,-1), header_gray),
    ('GRID',(0,0),(-1,-1), 0.3, colors.HexColor('#cccccc')),
    ('ALIGN',(1,0),(-1,-1),'CENTER'),
    ('VALIGN',(0,0),(-1,-1),'MIDDLE'),
] + PAD))
story.append(fp)

# ── VALORES ──
story.append(Paragraph("COMPOSIÇÃO DE VALORES", section_s))

def brl(v):
    return "R$ " + f"{v:,.2f}".replace(",","X").replace(".",",").replace("X",".")

subtotal = sum(rate * pts for _, rate, pts in ITENS_VALOR)
nf       = subtotal * NF_PERCENTUAL
base_bv  = subtotal + nf
bv       = base_bv * BV_PERCENTUAL
total    = base_bv + bv

val_data = [[pb("Categoria"), pb("Valor/Hora"), pb("Pontos"), pb("Valor Total")]]
for desc, rate, pts in ITENS_VALOR:
    val_data.append([desc, brl(rate), str(pts), brl(rate * pts)])
val_data.append([pb("Subtotal"), "", "", pb(brl(subtotal))])
val_data.append([f"Emissão de NF ({int(NF_PERCENTUAL*100)}%)", "", "", brl(nf)])
val_data.append([pb(f"BV ({int(BV_PERCENTUAL*100)}%)"), "", "", pb(brl(bv))])

vt = Table(val_data, colWidths=[8.2*cm, 2.3*cm, 2.5*cm, 4.0*cm])
vt.setStyle(TableStyle([
    ('BACKGROUND',(0,0),(-1,0), header_gray),
    ('FONTSIZE',(0,0),(-1,-1), 8),
    ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white, light_gray]),
    ('GRID',(0,0),(-1,-1), 0.3, colors.HexColor('#cccccc')),
    ('ALIGN',(1,0),(-1,-1),'RIGHT'),
    ('VALIGN',(0,0),(-1,-1),'MIDDLE'),
] + PAD))
story.append(vt)

story.append(Spacer(1, 6))
tot = Table([[
    p('<b>INVESTIMENTO TOTAL</b>',
      ParagraphStyle('ti', fontSize=11, fontName='Helvetica-Bold', textColor=colors.white)),
    p(f'<b>{brl(total)}</b>',
      ParagraphStyle('tv', fontSize=11, fontName='Helvetica-Bold',
                     textColor=colors.white, alignment=TA_RIGHT))
]], colWidths=[11.5*cm, 5.5*cm])
tot.setStyle(TableStyle([
    ('BACKGROUND',(0,0),(-1,-1), dark),
    ('VALIGN',(0,0),(-1,-1),'MIDDLE'),
    ('TOPPADDING',(0,0),(-1,-1),9), ('BOTTOMPADDING',(0,0),(-1,-1),9),
    ('LEFTPADDING',(0,0),(-1,-1),10), ('RIGHTPADDING',(0,0),(-1,-1),10),
]))
story.append(tot)

doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
print(f"PDF gerado: {os.path.abspath(OUTPUT_PATH)}")
