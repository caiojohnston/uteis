export type APFTipo = 'ALI' | 'AIE' | 'EE' | 'SE' | 'CE';
export type APFComplexidade = 'Baixa' | 'Média' | 'Alta';

export interface EscopoItem {
  id: string;
  funcionalidade: string;
  descricao: string;
}

export interface APFItem {
  id: string;
  funcionalidade: string;
  tipo: APFTipo;
  complexidade: APFComplexidade;
  pontos: number;
}

export interface ValorItem {
  id: string;
  descricao: string;
  valorHora: number;
  pontos: number;
}

export interface OrcamentoData {
  titulo: string;
  consultor: string;
  rodapeTexto: string;
  circleLogoUrl: string | null;
  entangleLogoUrl: string | null;
  escopo: EscopoItem[];
  apf: APFItem[];
  valores: ValorItem[];
  nfPercentual: number;
  bvPercentual: number;
}
