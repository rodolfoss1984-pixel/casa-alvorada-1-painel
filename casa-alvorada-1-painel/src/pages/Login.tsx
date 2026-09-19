import { useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [modo, setModo] = useState<"entrar" | "primeiro-acesso">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function entrar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setAviso(null);
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) setErro(traduzErro(error.message));
    setCarregando(false);
  }

  async function primeiroAcesso(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setAviso(null);
    setCarregando(true);
    const { error } = await supabase.auth.signUp({ email, password: senha });
    if (error) {
      setErro(traduzErro(error.message));
    } else {
      setAviso("Conta criada. Se pedir confirmação, olha seu e-mail — depois é só entrar com e-mail e senha aqui.");
      setModo("entrar");
    }
    setCarregando(false);
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="brand">
          <div className="mark">CA</div>
          <div className="txt"><b>Casa Alvorada 1</b><span>PAINEL DO EMPREENDIMENTO</span></div>
        </div>
        <div>
          <h1>{modo === "entrar" ? "Entrar" : "Primeiro acesso"}</h1>
          <p className="sub">
            {modo === "entrar"
              ? "Acesso restrito aos sócios da SPE. Cada um entra com o próprio login."
              : "Use o mesmo e-mail que o admin já cadastrou pra você como sócio."}
          </p>
        </div>

        {erro && <div className="login-error">{erro}</div>}
        {aviso && <div className="login-error" style={{ color: "var(--status-good)", borderColor: "color-mix(in srgb, var(--status-good) 30%, transparent)", background: "color-mix(in srgb, var(--status-good) 10%, var(--surface))" }}>{aviso}</div>}

        <form onSubmit={modo === "entrar" ? entrar : primeiroAcesso} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="field">
            <label htmlFor="em">E-mail</label>
            <input id="em" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="pw">Senha</label>
            <input id="pw" type="password" placeholder="••••••••" value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={6} />
          </div>
          <button className="btn primary" style={{ width: "100%", padding: 10 }} type="submit" disabled={carregando}>
            {carregando ? "..." : modo === "entrar" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <p className="login-note">
          {modo === "entrar" ? (
            <>Primeira vez aqui? <button className="login-link" onClick={() => { setModo("primeiro-acesso"); setErro(null); setAviso(null); }}>Criar acesso</button></>
          ) : (
            <>Já tem conta? <button className="login-link" onClick={() => { setModo("entrar"); setErro(null); setAviso(null); }}>Entrar</button></>
          )}
        </p>
      </div>
    </div>
  );
}

function traduzErro(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "E-mail ou senha incorretos.";
  if (msg.includes("User already registered")) return "Já existe conta com esse e-mail — clique em Entrar.";
  if (msg.includes("Password should be")) return "A senha precisa ter pelo menos 6 caracteres.";
  return msg;
}
