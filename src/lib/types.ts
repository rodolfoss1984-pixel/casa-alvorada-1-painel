export type Socio = {
  id: string;
  auth_user_id: string | null;
  nome: string;
  papel: "admin" | "socio";
  telefone: string | null;
  email: string | null;
  telegram_chat_id: number | null;
  telegram_username: string | null;
  ativo: boolean;
  created_at: string;
};

export type CategoriaDespesa = {
  id: string;
  nome: string;
  cor: string | null;
  ordem: number;
  ativa: boolean;
  created_at: string;
};

export type EtapaObra = {
  id: string;
  nome: string;
  ordem: number;
  atual: boolean;
  created_at: string;
};

export type Aporte = {
  id: string;
  socio_id: string;
  tipo: "dinheiro" | "terreno" | "outro";
  valor: number;
  descricao: string | null;
  data: string;
  registrado_por: string | null;
  created_at: string;
};

export type Despesa = {
  id: string;
  categoria_id: string | null;
  socio_id: string | null;
  fornecedor: string;
  valor: number;
  data: string;
  nota_fiscal_path: string | null;
  origem: "telegram" | "manual";
  estorno_de: string | null;
  telegram_message_id: number | null;
  created_at: string;
};

export type HistoricoEvento = {
  id: string;
  ator_socio_id: string | null;
  tipo: string;
  descricao: string;
  created_at: string;
};

export type ConfigEmpreendimento = {
  id: boolean;
  nome: string;
  razao_social: string | null;
  cnpj: string | null;
  endereco: string | null;
  cep: string | null;
  grupo_telegram_autorizado: string | null;
  notif_novo_gasto: boolean;
  notif_resumo_semanal: boolean;
  notif_saldo_baixo: boolean;
  updated_at: string;
};

export type ParticipacaoSocio = {
  socio_id: string;
  nome: string;
  ativo: boolean;
  total_aportado: number;
  percentual: number;
};

export type SaldoCaixa = {
  total_aportado: number;
  total_gasto: number;
  saldo: number;
};
