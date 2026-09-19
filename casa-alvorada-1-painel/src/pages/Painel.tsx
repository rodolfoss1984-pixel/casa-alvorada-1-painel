import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import type { CategoriaDespesa, Despesa, EtapaObra, ParticipacaoSocio, SaldoCaixa, Socio } from "../lib/types";
import { corCategoria, formatBRL, formatBRLCents, formatDateShort, iniciais } from "../lib/format";

type DespesaComRelacoes = Despesa & { categorias_despesa: CategoriaDespesa | null; socios: Socio | null };

export default function Painel() {
  const { socio } = useAuth();
  const [carregando, setCarregando] = useState(true);
  const [participacao, setParticipacao] = useState<ParticipacaoSocio[]>([]);
  const [saldo, setSaldo] = useState<SaldoCaixa | null>(null);
  const [recentes, setRecentes] = useState<DespesaComRelacoes[]>([]);
  const [categorias, setCategorias] = useState<CategoriaDespesa[]>([]);
  const [gastosPorCategoria, setGastosPorCategoria] = useState<{ categoria: CategoriaDespesa; total: number }[]>([]);
  const [etapas, setEtapas] = useState<EtapaObra[]>([]);

  useEffect(() => {
    (async () => {
      setCarregando(true);
      const [p, s, r, c, todasDespesas, e] = await Promise.all([
        supabase.from("participacao_socios").select("*").order("percentual", { ascending: false }),
        supabase.from("saldo_caixa").select("*").single(),
        supabase
          .from("despesas")
          .select("*, categorias_despesa(*), socios(*)")
          .is("estorno_de", null)
          .order("data", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(4),
        supabase.from("categorias_despesa").select("*").eq("ativa", true).order("ordem"),
        supabase.from("despesas").select("categoria_id, valor").is("estorno_de", null),
        supabase.from("etapas_obra").select("*").order("ordem"),
      ]);
      setParticipacao(p.data ?? []);
      setSaldo(s.data ?? null);
      setRecentes((r.data as DespesaComRelacoes[]) ?? []);
      setCategorias(c.data ?? []);
      setEtapas(e.data ?? []);

      if (c.data && todasDespesas.data) {
        const somaPorCat = new Map<string, number>();
        for (const d of todasDespesas.data) {
          if (!d.categoria_id) continue;
          somaPorCat.set(d.categoria_id, (somaPorCat.get(d.categoria_id) ?? 0) + Number(d.valor));
        }
        const lista = c.data
          .map((cat) => ({ categoria: cat, total: somaPorCat.get(cat.id) ?? 0 }))
          .filter((x) => x.total > 0)
          .sort((a, b) => b.total - a.total);
        setGastosPorCategoria(lista);
      }
      setCarregando(false);
    })();
  }, []);

  if (carregando) return <div className="spinner-wrap">carregando…</div>;

  const totalAportado = saldo?.total_aportado ?? 0;
  const totalGasto = saldo?.total_gasto ?? 0;
  const pctGasto = totalAportado > 0 ? (totalGasto / totalAportado) * 100 : 0;

  const idxEtapaAtual = etapas.findIndex((e) => e.atual);
  const progressoObra = etapas.length > 0 ? Math.round(((idxEtapaAtual >= 0 ? idxEtapaAtual : 0) / (etapas.length - 1 || 1)) * 100) : 0;
  const nomeEtapaAtual = idxEtapaAtual >= 0 ? etapas[idxEtapaAtual].nome : "—";

  const totalCategorias = gastosPorCategoria.reduce((s, x) => s + x.total, 0);
  let acc = 0;
  const conicStops = gastosPorCategoria
    .map((g, i) => {
      const pct = totalCategorias > 0 ? (g.total / totalCategorias) * 100 : 0;
      const from = acc;
      acc += pct;
      return `${corCategoria(i)} ${from}% ${acc}%`;
    })
    .join(", ");

  return (
    <section>
      <div className="topbar">
        <div>
          <h1>Painel</h1>
          <p>Desmembramento de 10x25 em 2 lotes de 5x25 · construção da primeira casa em andamento.</p>
        </div>
        {socio && (
          <div className="who">
            <div className="av">{iniciais(socio.nome)}</div>
            <div>
              <div style={{ fontWeight: 600 }}>{socio.nome}</div>
              <div style={{ color: "var(--muted)", fontSize: 11 }}>{socio.papel === "admin" ? "Admin" : "Sócio"}</div>
            </div>
          </div>
        )}
      </div>

      <section className="kpis">
        <div className="kpi">
          <span className="label">Total aportado</span>
          <span className="value num">{formatBRL(totalAportado)}</span>
          <span className="sub">{participacao.length} sócio{participacao.length === 1 ? "" : "s"}</span>
        </div>
        <div className="kpi">
          <span className="label">Total gasto</span>
          <span className="value num">{formatBRL(totalGasto)}</span>
          <span className="sub">{pctGasto.toFixed(1).replace(".", ",")}% do aportado</span>
        </div>
        <div className="kpi">
          <span className="label">Saldo em caixa</span>
          <span className="value num">{formatBRL(saldo?.saldo)}</span>
          <span className="sub">conta PJ da SPE</span>
        </div>
        <div className="kpi">
          <span className="label">Progresso da obra</span>
          <span className="value num">{etapas.length > 0 ? `${progressoObra}%` : "—"}</span>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${progressoObra}%` }} /></div>
          <span className="sub">{etapas.length > 0 ? nomeEtapaAtual : "sem etapas cadastradas"}</span>
        </div>
      </section>

      <div className="grid-main">
        <div className="panel">
          <h2>Lançamentos recentes <span className="count">via bot do Telegram</span></h2>
          {recentes.length === 0 ? (
            <p className="empty-note">Nenhum lançamento ainda. Manda a primeira nota fiscal pro bot no Telegram.</p>
          ) : (
            <>
              <div className="tx-head"><span></span><span>Fornecedor</span><span style={{ textAlign: "right" }}>Valor</span></div>
              {recentes.map((d) => (
                <div className="tx-row" key={d.id}>
                  <div className="date">{formatDateShort(d.data)}</div>
                  <div className="who-av">{d.socios ? iniciais(d.socios.nome) : "?"}</div>
                  <div className="main-c">
                    <div className="fornecedor">{d.fornecedor}</div>
                    <div className="cat">
                      <span className="dot" style={{ background: d.categorias_despesa ? corCategoria(categorias.findIndex((c) => c.id === d.categorias_despesa!.id)) : "var(--cat-neutral)" }}></span>
                      {d.categorias_despesa?.nome ?? "Sem categoria"}
                    </div>
                  </div>
                  <div className="valor num">{formatBRLCents(d.valor)}</div>
                </div>
              ))}
            </>
          )}
        </div>

        <div>
          <div className="panel">
            <h2>Gastos por categoria</h2>
            {gastosPorCategoria.length === 0 ? (
              <p className="empty-note">Sem gastos registrados ainda.</p>
            ) : (
              <div className="donut-wrap">
                <div className="donut" style={{ background: `conic-gradient(${conicStops})` }}>
                  <div className="center"><span className="v num">{formatBRL(totalCategorias)}</span><span className="l">total</span></div>
                </div>
                <div className="legend">
                  {gastosPorCategoria.map((g, i) => (
                    <div className="row" key={g.categoria.id}>
                      <span className="k"><span className="dot" style={{ background: corCategoria(i) }}></span>{g.categoria.nome}</span>
                      <span className="v num">{totalCategorias > 0 ? `${((g.total / totalCategorias) * 100).toFixed(0)}%` : "0%"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="panel">
            <h2>Participação por sócio</h2>
            {participacao.length === 0 ? (
              <p className="empty-note">Nenhum aporte registrado ainda.</p>
            ) : (
              <div className="partners">
                {participacao.map((p) => (
                  <div className="p-row" key={p.socio_id}>
                    <div className="p-head"><span className="p-name">{p.nome}</span><span className="p-pct num">{p.percentual.toFixed(2).replace(".", ",")}%</span></div>
                    <div className="p-track"><div className="p-fill" style={{ width: `${p.percentual}%` }} /></div>
                    <div className="p-val num">{formatBRL(p.total_aportado)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
