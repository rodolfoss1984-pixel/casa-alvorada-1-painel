import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import type { ParticipacaoSocio, Socio } from "../lib/types";
import { formatBRL, iniciais } from "../lib/format";

export default function Socios() {
  const { socio: eu } = useAuth();
  const isAdmin = eu?.papel === "admin";
  const [carregando, setCarregando] = useState(true);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [participacao, setParticipacao] = useState<ParticipacaoSocio[]>([]);
  const [editando, setEditando] = useState<Socio | null>(null);
  const [novo, setNovo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    setCarregando(true);
    const [s, p] = await Promise.all([
      supabase.from("socios").select("*").eq("ativo", true).order("created_at"),
      supabase.from("participacao_socios").select("*"),
    ]);
    setSocios(s.data ?? []);
    setParticipacao(p.data ?? []);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  if (carregando) return <div className="spinner-wrap">carregando…</div>;

  async function salvarEdicao(dados: { id?: string; nome: string; telefone: string; email: string; telegram_username: string }) {
    setErro(null);
    if (dados.id) {
      const { error } = await supabase
        .from("socios")
        .update({ nome: dados.nome, telefone: dados.telefone || null, email: dados.email || null, telegram_username: dados.telegram_username || null })
        .eq("id", dados.id);
      if (error) { setErro(error.message); return; }
    } else {
      const { error } = await supabase
        .from("socios")
        .insert({ nome: dados.nome, telefone: dados.telefone || null, email: dados.email || null, telegram_username: dados.telegram_username || null, papel: "socio" });
      if (error) { setErro(error.message); return; }
    }
    setEditando(null);
    setNovo(false);
    await carregar();
  }

  async function remover(id: string) {
    if (!confirm("Remover esse sócio da lista de ativos? Os lançamentos dele continuam no histórico.")) return;
    const { error } = await supabase.from("socios").update({ ativo: false }).eq("id", id);
    if (error) { setErro(error.message); return; }
    await carregar();
  }

  return (
    <section>
      <div className="topbar">
        <div>
          <h1>Sócios</h1>
          <p>Quem participa da SPE, quanto aportou e como entrar em contato.</p>
        </div>
      </div>
      <p style={{ margin: "-4px 0 14px", fontSize: 12, color: "var(--ink-soft)", maxWidth: "62ch", lineHeight: 1.5 }}>
        "Editar" aqui só muda dado cadastral (telefone, e-mail, Telegram). Aporte e % de participação não têm campo pra editar — eles são a soma dos aportes já registrados, então só mudam quando entra um aporte novo. "Remover" tira o sócio da lista de ativos, mas os aportes e gastos que já passaram por ele continuam no histórico do jeito que estão.
      </p>
      {erro && <div className="login-error" style={{ marginBottom: 14 }}>{erro}</div>}

      <div className="panel">
        {socios.map((s) => {
          const part = participacao.find((p) => p.socio_id === s.id);
          const semTelegram = !s.telegram_chat_id;
          return (
            <div className="socio-card" key={s.id}>
              <div className="av-lg">{iniciais(s.nome)}</div>
              <div className="id">
                <div className="name">{s.nome} {s.papel === "admin" && <span className="tag">ADMIN</span>}</div>
                <div className="contact">
                  {s.telegram_username
                    ? (semTelegram ? "Telegram pendente · @" + s.telegram_username : "Telegram vinculado · @" + s.telegram_username)
                    : "Sem Telegram cadastrado"}
                </div>
              </div>
              <div className="stat">
                <div className="v num">{formatBRL(part?.total_aportado ?? 0)}</div>
                <div className="l num">{(part?.percentual ?? 0).toFixed(2).replace(".", ",")}%</div>
              </div>
              {isAdmin && (
                <div className="acts">
                  <button className="btn ghost" onClick={() => setEditando(s)}>Editar</button>
                  {s.papel !== "admin" && <button className="btn ghost danger" onClick={() => remover(s.id)}>Remover</button>}
                </div>
              )}
            </div>
          );
        })}
        {isAdmin && (
          <div style={{ paddingTop: 14 }}>
            <button className="btn primary" onClick={() => setNovo(true)}>+ Adicionar sócio</button>
          </div>
        )}
      </div>

      {(editando || novo) && (
        <EditarSocioModal
          socio={editando}
          onFechar={() => { setEditando(null); setNovo(false); setErro(null); }}
          onSalvar={salvarEdicao}
        />
      )}
    </section>
  );
}

function EditarSocioModal({
  socio,
  onFechar,
  onSalvar,
}: {
  socio: Socio | null;
  onFechar: () => void;
  onSalvar: (d: { id?: string; nome: string; telefone: string; email: string; telegram_username: string }) => void;
}) {
  const [nome, setNome] = useState(socio?.nome ?? "");
  const [telefone, setTelefone] = useState(socio?.telefone ?? "");
  const [email, setEmail] = useState(socio?.email ?? "");
  const [telegramUsername, setTelegramUsername] = useState(socio?.telegram_username ?? "");

  return (
    <div className="modal-backdrop" onClick={onFechar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{socio ? "Editar sócio" : "Adicionar sócio"}</h3>
        <div className="field"><label>Nome</label><input value={nome} onChange={(e) => setNome(e.target.value)} /></div>
        <div className="field"><label>Telefone</label><input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" /></div>
        <div className="field"><label>E-mail</label><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usado pro login no painel" /></div>
        <div className="field"><label>Usuário do Telegram</label><input value={telegramUsername} onChange={(e) => setTelegramUsername(e.target.value.replace("@", ""))} placeholder="sem @, ex: eugerador" /></div>
        <div className="acts">
          <button className="btn ghost" onClick={onFechar}>Cancelar</button>
          <button className="btn primary" onClick={() => onSalvar({ id: socio?.id, nome, telefone, email, telegram_username: telegramUsername })} disabled={!nome.trim()}>Salvar</button>
        </div>
      </div>
    </div>
  );
}
