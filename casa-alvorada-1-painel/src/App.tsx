import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import { supabase } from "./lib/supabase";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Painel from "./pages/Painel";
import Lancamentos from "./pages/Lancamentos";
import Socios from "./pages/Socios";
import Lotes from "./pages/Lotes";
import Config from "./pages/Config";

function AppShell() {
  const { session, socio, loading, semSocioVinculado, refreshSocio } = useAuth();

  if (loading) return <div className="spinner-wrap">carregando…</div>;
  if (!session) return <Login />;

  if (semSocioVinculado) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="brand">
            <div className="mark">CA</div>
            <div className="txt"><b>Casa Alvorada 1</b><span>PAINEL DO EMPREENDIMENTO</span></div>
          </div>
          <div>
            <h1>Conta sem vínculo</h1>
            <p className="sub">
              Seu login funcionou, mas esse e-mail ({session.user.email}) ainda não está cadastrado como sócio ativo.
              Peça pro admin te cadastrar em Sócios com esse mesmo e-mail.
            </p>
          </div>
          <button className="btn ghost" onClick={refreshSocio}>Já fui cadastrado, tentar de novo</button>
          <button className="btn ghost" onClick={() => supabase.auth.signOut()}>Sair</button>
        </div>
      </div>
    );
  }

  if (!socio) return <div className="spinner-wrap">carregando…</div>;

  return (
    <div className="app">
      <Sidebar isAdmin={socio.papel === "admin"} />
      <main className="main">
        <Routes>
          <Route path="/" element={<Painel />} />
          <Route path="/lancamentos" element={<Lancamentos />} />
          <Route path="/socios" element={<Socios />} />
          <Route path="/lotes" element={<Lotes />} />
          <Route path="/config" element={socio.papel === "admin" ? <Config /> : <Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}
