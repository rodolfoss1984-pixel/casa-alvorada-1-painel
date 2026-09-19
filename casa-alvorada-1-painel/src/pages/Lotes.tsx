import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import type { EtapaObra } from "../lib/types";

type Lote = {
  id: string;
  nome: string;
  area: string | null;
  status: "planejado" | "definido" | "em_obra" | "concluido";
  observacao: string | null;
  etapa_atual_id: string | null;
  ordem: number;
};

const STATUS_LABEL: Record<Lote["status"], { label: string; pill: string }> = {
  planejado: { label: "Planejado", pill: "" },
  definido: { label: "Definido", pill: "good" },
  em_obra: { label: "Em andamento", pill: "warn" },
  concluido: { label: "Concluído", pill: "good" },
};

export default function Lotes() {
  const { socio } = useAuth();
  const isAdmin = socio?.papel === "admin";
  const [carregando, setCarregando] = useState(true);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [etapas, setEtapas] = useState<EtapaObra[]>([]);
  const [editando, setEditando] = useState<Lote | null>(null);

  async function carregar() {
    setCarregando(true);
    const [l, e] = await Promise.all([
      supabase.from("lotes").select("*").order("ordem"),
      supabase.from("etapas_obra").select("*").order("ordem"),
    ]);
    setLotes(l.data ?? []);
    setEtapas(e.data ?? []);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  if (carregando) return <div className="spinner-wrap">carregando…</div>;

  async function salvar(dados: Lote) {
    await supabase
      .from("lotes")
      .update({ nome: dados.nome, area: dados.area, status: dados.status, observacao: dados.observacao, etapa_atual_id: dados.etapa_atual_id })
      .eq("id", dados.id);
    setEditando(null);
    await carregar();
  }

  return (
    <section>
      <div className="topbar">
        <div>
          <h1>Lotes &amp; Obra</h1>
          <p>Os lotes que saíram do desmembramento do terreno original de 10x25.</p>
        </div>
      </div>
      <div className="lotes">
        {lotes.map((lote) => {
          const idxAtual = lote.etapa_atual_id ? etapas.findIndex((e) => e.id === lote.etapa_atual_id) : -1;
          const st = STATUS_LABEL[lote.status];
          return (
            <div className="lote" key={lote.id}>
              <span className="eyebrow">{lote.nome}{lote.area ? ` · ${lote.area}` : ""}</span>
              <h3>{lote.observacao?.split(" — ")[0] ?? lote.nome}</h3>
              {st.pill ? <span className={`pill ${st.pill}`}><span className="dot"></span>{st.label}</span> : <span className="pill"><span className="dot"></span>{st.label}</span>}
              {lote.observacao && <p className="foot">{lote.observacao}</p>}

              {lote.status === "em_obra" && etapas.length > 0 && (
                <div className="stepper">
                  {etapas.map((e, i) => (
                    <div className={"step" + (i < idxAtual ? " done" : i === idxAtual ? " now" : "")} key={e.id}>
                      {i > 0 && <div className="line"></div>}
                      <div className="node"></div>
                      <span>{e.nome}</span>
                    </div>
                  ))}
                </div>
              )}

              {isAdmin && (
                <div style={{ marginTop: 12 }}>
                  <button className="btn ghost" onClick={() => setEditando(lote)}>Editar</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editando && (
        <EditarLoteModal lote={editando} etapas={etapas} onFechar={() => setEditando(null)} onSalvar={salvar} />
      )}
    </section>
  );
}

function EditarLoteModal({
  lote,
  etapas,
  onFechar,
  onSalvar,
}: {
  lote: Lote;
  etapas: EtapaObra[];
  onFechar: () => void;
  onSalvar: (l: Lote) => void;
}) {
  const [nome, setNome] = useState(lote.nome);
  const [area, setArea] = useState(lote.area ?? "");
  const [status, setStatus] = useState<Lote["status"]>(lote.status);
  const [observacao, setObservacao] = useState(lote.observacao ?? "");
  const [etapaAtualId, setEtapaAtualId] = useState(lote.etapa_atual_id ?? "");

  return (
    <div className="modal-backdrop" onClick={onFechar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Editar {lote.nome}</h3>
        <div className="field"><label>Nome</label><input value={nome} onChange={(e) => setNome(e.target.value)} /></div>
        <div className="field"><label>Área</label><input value={area} onChange={(e) => setArea(e.target.value)} placeholder="ex: 5x25" /></div>
        <div className="field">
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as Lote["status"])}>
            <option value="planejado">Planejado</option>
            <option value="definido">Definido</option>
            <option value="em_obra">Em andamento</option>
            <option value="concluido">Concluído</option>
          </select>
        </div>
        {status === "em_obra" && (
          <div className="field">
            <label>Etapa atual</label>
            <select value={etapaAtualId} onChange={(e) => setEtapaAtualId(e.target.value)}>
              <option value="">—</option>
              {etapas.map((et) => <option key={et.id} value={et.id}>{et.nome}</option>)}
            </select>
          </div>
        )}
        <div className="field"><label>Observação</label><input value={observacao} onChange={(e) => setObservacao(e.target.value)} /></div>
        <div className="acts">
          <button className="btn ghost" onClick={onFechar}>Cancelar</button>
          <button className="btn primary" onClick={() => onSalvar({ ...lote, nome, area, status, observacao, etapa_atual_id: etapaAtualId || null })}>Salvar</button>
        </div>
      </div>
    </div>
  );
}
