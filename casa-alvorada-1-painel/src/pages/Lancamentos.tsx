import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { CategoriaDespesa, Despesa, Socio } from "../lib/types";
import { corCategoria, formatBRLCents, formatDateShort, iniciais } from "../lib/format";

type DespesaComRelacoes = Despesa & { categorias_despesa: CategoriaDespesa | null; socios: Socio | null };

export default function Lancamentos() {
  const [carregando, setCarregando] = useState(true);
  const [despesas, setDespesas] = useState<DespesaComRelacoes[]>([]);
  const [categorias, setCategorias] = useState<CategoriaDespesa[]>([]);
  const [filtro, setFiltro] = useState<string>("all");

  useEffect(() => {
    (async () => {
      setCarregando(true);
      const [d, c] = await Promise.all([
        supabase
          .from("despesas")
          .select("*, categorias_despesa(*), socios(*)")
          .order("data", { ascending: false })
          .order("created_at", { ascending: false }),
        supabase.from("categorias_despesa").select("*").order("ordem"),
      ]);
      setDespesas((d.data as DespesaComRelacoes[]) ?? []);
      setCategorias(c.data ?? []);
      setCarregando(false);
    })();
  }, []);

  if (carregando) return <div className="spinner-wrap">carregando…</div>;

  const visiveis = filtro === "all" ? despesas : despesas.filter((d) => d.categoria_id === filtro);

  return (
    <section>
      <div className="topbar">
        <div>
          <h1>Lançamentos</h1>
          <p>Todo gasto que chega pelo bot do Telegram cai aqui, já classificado.</p>
        </div>
      </div>
      <p style={{ margin: "-4px 0 14px", fontSize: 12, color: "var(--ink-soft)", maxWidth: "62ch", lineHeight: 1.5 }}>
        Um lançamento salvo é intocável — ninguém edita valor ou categoria depois do fato. Pra corrigir um erro, registra um estorno referenciando o lançamento errado e lança de novo certo; assim o histórico mostra os dois, sem apagar nada.
      </p>

      <div className="chips">
        <button className={"chip" + (filtro === "all" ? " active" : "")} onClick={() => setFiltro("all")}>Todas</button>
        {categorias.map((c) => (
          <button key={c.id} className={"chip" + (filtro === c.id ? " active" : "")} onClick={() => setFiltro(c.id)}>{c.nome}</button>
        ))}
      </div>

      <div className="panel">
        {visiveis.length === 0 ? (
          <p className="empty-note">Nenhum lançamento nessa categoria ainda.</p>
        ) : (
          <>
            <div className="tx-head"><span></span><span>Fornecedor</span><span style={{ textAlign: "right" }}>Valor</span></div>
            {visiveis.map((d) => {
              const idxCat = categorias.findIndex((c) => c.id === d.categoria_id);
              const isEstorno = !!d.estorno_de;
              return (
                <div className="tx-row" key={d.id}>
                  <div className="date">{formatDateShort(d.data)}</div>
                  <div className="who-av">{d.socios ? iniciais(d.socios.nome) : "?"}</div>
                  <div className="main-c">
                    <div className="fornecedor">{isEstorno ? "↩ " : ""}{d.fornecedor}</div>
                    <div className="cat">
                      <span className="dot" style={{ background: corCategoria(idxCat) }}></span>
                      {d.categorias_despesa?.nome ?? "Sem categoria"}
                    </div>
                  </div>
                  <div className="valor num">{formatBRLCents(d.valor)}</div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </section>
  );
}
