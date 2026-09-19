import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import type { CategoriaDespesa, ConfigEmpreendimento, EtapaObra, HistoricoEvento, Socio } from "../lib/types";
import { formatDateTime, iniciais } from "../lib/format";

const CAT_DOT_COLORS = ["var(--cat-1)", "var(--cat-2)", "var(--cat-3)", "var(--cat-4)"];

export default function Config() {
  const { socio } = useAuth();
  const [carregando, setCarregando] = useState(true);
  const [categorias, setCategorias] = useState<CategoriaDespesa[]>([]);
  const [contagemCategorias, setContagemCategorias] = useState<Record<string, number>>({});
  const [etapas, setEtapas] = useState<EtapaObra[]>([]);
  const [config, setConfig] = useState<ConfigEmpreendimento | null>(null);
  const [historico, setHistorico] = useState<(HistoricoEvento & { socios: Socio | null })[]>([]);
  const [novaCategoria, setNovaCategoria] = useState("");
  const [novaEtapa, setNovaEtapa] = useState("");

  async function carregar() {
    setCarregando(true);
    const [c, e, cfg, h, d] = await Promise.all([
      supabase.from("categorias_despesa").select("*").order("ordem"),
      supabase.from("etapas_obra").select("*").order("ordem"),
      supabase.from("config_empreendimento").select("*").single(),
      supabase.from("historico_eventos").select("*, socios(*)").order("created_at", { ascending: false }).limit(30),
      supabase.from("despesas").select("categoria_id"),
    ]);
    setCategorias(c.data ?? []);
    setEtapas(e.data ?? []);
    setConfig(cfg.data ?? null);
    setHistorico((h.data as (HistoricoEvento & { socios: Socio | null })[]) ?? []);
    const contagem: Record<string, number> = {};
    for (const row of d.data ?? []) {
      if (!row.categoria_id) continue;
      contagem[row.categoria_id] = (contagem[row.categoria_id] ?? 0) + 1;
    }
    setContagemCategorias(contagem);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  if (carregando) return <div className="spinner-wrap">carregando…</div>;
  if (socio?.papel !== "admin") {
    return (
      <section>
        <div className="topbar"><div><h1>Configurações</h1><p>Essa área é só do admin.</p></div></div>
      </section>
    );
  }

  // ---------- categorias ----------
  async function renomearCategoria(id: string, nome: string) {
    await supabase.from("categorias_despesa").update({ nome }).eq("id", id);
  }
  async function toggleAtivaCategoria(cat: CategoriaDespesa) {
    await supabase.from("categorias_despesa").update({ ativa: !cat.ativa }).eq("id", cat.id);
    await carregar();
  }
  async function moverCategoria(idx: number, dir: -1 | 1) {
    const alvo = categorias[idx + dir];
    const atual = categorias[idx];
    if (!alvo) return;
    await Promise.all([
      supabase.from("categorias_despesa").update({ ordem: alvo.ordem }).eq("id", atual.id),
      supabase.from("categorias_despesa").update({ ordem: atual.ordem }).eq("id", alvo.id),
    ]);
    await carregar();
  }
  async function adicionarCategoria() {
    if (!novaCategoria.trim()) return;
    const maxOrdem = categorias.reduce((m, c) => Math.max(m, c.ordem), 0);
    await supabase.from("categorias_despesa").insert({ nome: novaCategoria.trim(), ordem: maxOrdem + 1 });
    setNovaCategoria("");
    await carregar();
  }

  // ---------- etapas ----------
  async function renomearEtapa(id: string, nome: string) {
    await supabase.from("etapas_obra").update({ nome }).eq("id", id);
  }
  async function marcarEtapaAtual(id: string) {
    await supabase.from("etapas_obra").update({ atual: false }).neq("id", id);
    await supabase.from("etapas_obra").update({ atual: true }).eq("id", id);
    await carregar();
  }
  async function moverEtapa(idx: number, dir: -1 | 1) {
    const alvo = etapas[idx + dir];
    const atual = etapas[idx];
    if (!alvo) return;
    await Promise.all([
      supabase.from("etapas_obra").update({ ordem: alvo.ordem }).eq("id", atual.id),
      supabase.from("etapas_obra").update({ ordem: atual.ordem }).eq("id", alvo.id),
    ]);
    await carregar();
  }
  async function adicionarEtapa() {
    if (!novaEtapa.trim()) return;
    const maxOrdem = etapas.reduce((m, e) => Math.max(m, e.ordem), 0);
    await supabase.from("etapas_obra").insert({ nome: novaEtapa.trim(), ordem: maxOrdem + 1 });
    setNovaEtapa("");
    await carregar();
  }

  // ---------- config da spe / notificações ----------
  async function salvarConfig(patch: Partial<ConfigEmpreendimento>) {
    if (!config) return;
    const atualizado = { ...config, ...patch };
    setConfig(atualizado);
    await supabase.from("config_empreendimento").update(patch).eq("id", true);
  }

  return (
    <section>
      <div className="topbar"><div><h1>Configurações</h1><p>Tudo aqui só o admin (você) consegue alterar.</p></div></div>
      <span className="admin-badge">🔒 Área do admin — {socio.nome}</span>

      <div className="panel">
        <h2>Categorias de despesa</h2>
        <p style={{ margin: "0 0 10px", fontSize: 12, color: "var(--ink-soft)", maxWidth: "56ch", lineHeight: 1.5 }}>
          Renomeie ou reordene. Uma categoria em uso não pode ser apagada de vez — desative pra tirá-la das opções novas sem bagunçar os lançamentos que já existem com ela.
        </p>
        {categorias.map((cat, idx) => (
          <div className="etapa-row" key={cat.id} style={{ opacity: cat.ativa ? 1 : 0.5 }}>
            <span className="handle" style={{ display: "flex", flexDirection: "column", gap: 0, cursor: "default" }}>
              <button onClick={() => moverCategoria(idx, -1)} disabled={idx === 0} style={{ border: "none", background: "none", cursor: "pointer", color: "inherit", lineHeight: 0.8 }}>▲</button>
              <button onClick={() => moverCategoria(idx, 1)} disabled={idx === categorias.length - 1} style={{ border: "none", background: "none", cursor: "pointer", color: "inherit", lineHeight: 0.8 }}>▼</button>
            </span>
            <span className="dot" style={{ background: idx < 4 ? CAT_DOT_COLORS[idx] : "var(--cat-neutral)", flex: "none" }}></span>
            <input type="text" defaultValue={cat.nome} onBlur={(e) => e.target.value.trim() && e.target.value !== cat.nome && renomearCategoria(cat.id, e.target.value.trim())} />
            <span style={{ fontSize: 11, color: "var(--muted)", flex: "none" }}>{contagemCategorias[cat.id] ?? 0} lançamentos</span>
            <button className="btn ghost" style={{ padding: "4px 9px", fontSize: 11 }} onClick={() => toggleAtivaCategoria(cat)}>{cat.ativa ? "Desativar" : "Ativar"}</button>
          </div>
        ))}
        <div style={{ paddingTop: 12, display: "flex", gap: 8 }}>
          <input className="etapa-row-input" style={{ fontSize: 13, padding: "7px 9px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--page-bg)", color: "var(--ink)" }} placeholder="nova categoria" value={novaCategoria} onChange={(e) => setNovaCategoria(e.target.value)} onKeyDown={(e) => e.key === "Enter" && adicionarCategoria()} />
          <button className="add-tag" onClick={adicionarCategoria}>+ nova categoria</button>
        </div>
        <p style={{ margin: "10px 0 0", fontSize: 11, color: "var(--muted)", lineHeight: 1.5 }}>A partir da 5ª categoria ativa, o gráfico do Painel passa a usar uma cor neutra pra elas — com muitas cores ao mesmo tempo fica difícil distinguir, então isso é proposital.</p>
      </div>

      <div className="panel">
        <h2>Etapas da obra</h2>
        <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--ink-soft)", maxWidth: "56ch", lineHeight: 1.5 }}>
          Essa lista define os passos que aparecem na barra de progresso em "Lotes &amp; Obra". Reordene com as setas, marque qual está em andamento e adicione etapas conforme a obra pedir.
        </p>
        {etapas.map((et, idx) => (
          <div className="etapa-row" key={et.id}>
            <span className="handle" style={{ display: "flex", flexDirection: "column", gap: 0, cursor: "default" }}>
              <button onClick={() => moverEtapa(idx, -1)} disabled={idx === 0} style={{ border: "none", background: "none", cursor: "pointer", color: "inherit", lineHeight: 0.8 }}>▲</button>
              <button onClick={() => moverEtapa(idx, 1)} disabled={idx === etapas.length - 1} style={{ border: "none", background: "none", cursor: "pointer", color: "inherit", lineHeight: 0.8 }}>▼</button>
            </span>
            <input type="text" defaultValue={et.nome} onBlur={(e) => e.target.value.trim() && e.target.value !== et.nome && renomearEtapa(et.id, e.target.value.trim())} />
            <label className="atual"><input type="radio" name="etapaAtual" checked={et.atual} onChange={() => marcarEtapaAtual(et.id)} />atual</label>
          </div>
        ))}
        <div style={{ paddingTop: 12, display: "flex", gap: 8 }}>
          <input style={{ fontSize: 13, padding: "7px 9px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--page-bg)", color: "var(--ink)" }} placeholder="nova etapa" value={novaEtapa} onChange={(e) => setNovaEtapa(e.target.value)} onKeyDown={(e) => e.key === "Enter" && adicionarEtapa()} />
          <button className="add-tag" onClick={adicionarEtapa}>+ nova etapa</button>
        </div>
      </div>

      <div className="panel">
        <h2>Integração com Telegram</h2>
        <div className="bot-status"><span className="lamp"></span><span style={{ fontSize: 13, fontWeight: 600 }}>Bot conectado — @CasaAlvorada01_bot</span></div>
        <p style={{ margin: 0, fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.5 }}>O token do bot fica guardado só nos secrets do Supabase — não aparece aqui nem em lugar nenhum do painel. Pra trocar, gere um novo token no BotFather e atualize o secret <code>TELEGRAM_BOT_TOKEN</code>.</p>
      </div>

      {config && (
        <div className="panel">
          <h2>Dados da SPE</h2>
          <div className="cfg-fields">
            <div className="field"><label>Razão social</label><input defaultValue={config.razao_social ?? ""} onBlur={(e) => e.target.value !== config.razao_social && salvarConfig({ razao_social: e.target.value })} /></div>
            <div className="field"><label>CNPJ</label><input defaultValue={config.cnpj ?? ""} onBlur={(e) => e.target.value !== config.cnpj && salvarConfig({ cnpj: e.target.value })} /></div>
            <div className="field"><label>Endereço do empreendimento</label><input defaultValue={config.endereco ?? ""} onBlur={(e) => e.target.value !== config.endereco && salvarConfig({ endereco: e.target.value })} /></div>
            <div className="field"><label>CEP</label><input defaultValue={config.cep ?? ""} onBlur={(e) => e.target.value !== config.cep && salvarConfig({ cep: e.target.value })} /></div>
          </div>
        </div>
      )}

      {config && (
        <div className="panel">
          <h2>Notificações</h2>
          <div className="cfg-row">
            <div><div className="t">Avisar todos a cada novo gasto</div><div className="d">Manda uma mensagem no grupo do Telegram sempre que uma nota fiscal é lançada.</div></div>
            <label className="switch"><input type="checkbox" checked={config.notif_novo_gasto} onChange={(e) => salvarConfig({ notif_novo_gasto: e.target.checked })} /><span className="track"></span><span className="thumb"></span></label>
          </div>
          <div className="cfg-row">
            <div><div className="t">Resumo semanal</div><div className="d">Todo domingo à noite, um resumo do que foi gasto na semana pra cada sócio.</div></div>
            <label className="switch"><input type="checkbox" checked={config.notif_resumo_semanal} onChange={(e) => salvarConfig({ notif_resumo_semanal: e.target.checked })} /><span className="track"></span><span className="thumb"></span></label>
          </div>
          <div className="cfg-row">
            <div><div className="t">Alertar quando o saldo em caixa ficar baixo</div><div className="d">Avisa o admin quando sobrar menos de 10% do total aportado.</div></div>
            <label className="switch"><input type="checkbox" checked={config.notif_saldo_baixo} onChange={(e) => salvarConfig({ notif_saldo_baixo: e.target.checked })} /><span className="track"></span><span className="thumb"></span></label>
          </div>
        </div>
      )}

      <div className="panel">
        <h2>Histórico de alterações <span className="count">visível pra todos os sócios, não só o admin</span></h2>
        {historico.length === 0 ? (
          <p className="empty-note">Nenhum evento registrado ainda.</p>
        ) : (
          historico.map((h) => (
            <div className="log-row" key={h.id}>
              <div className="who-av">{h.socios ? iniciais(h.socios.nome) : "?"}</div>
              <div className="body">
                <div className="what">{h.descricao}</div>
                <div className="when">{formatDateTime(h.created_at)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
