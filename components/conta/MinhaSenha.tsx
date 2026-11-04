"use client";

import { useEffect, useState } from "react";
import { FormularioNovaSenha } from "@/components/FormularioNovaSenha";

// Seção "Senha" da Minha conta: criar (para quem entrou pelo link) ou trocar a senha
export function MinhaSenha({ email }: { email: string }) {
  // Veio do e-mail "Esqueci minha senha": rola até aqui e destaca a seção
  const [veioDoEmail, setVeioDoEmail] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("senha") !== "nova") return;
    const espera = setTimeout(() => {
      setVeioDoEmail(true);
      document.getElementById("senha")?.scrollIntoView({ block: "start" });
      document.getElementById("senha-nova")?.focus({ preventScroll: true });
    }, 0);
    return () => clearTimeout(espera);
  }, []);

  return (
    <section id="senha" aria-labelledby="senha-titulo" className="flex scroll-mt-6 flex-col gap-4">
      <h2 id="senha-titulo" className="font-display text-2xl font-semibold">Senha</h2>
      <div className={`flex flex-col gap-4 rounded-2xl p-5 ${veioDoEmail ? "border-2 border-framboesa" : "border border-linha"}`}>
        {veioDoEmail && <p className="font-semibold">Você entrou pelo link. Agora crie a sua senha nova.</p>}
        <p className="text-sm text-ameixa-suave">
          Crie uma senha para entrar sem precisar esperar o link no e-mail. Se esqueceu a senha antiga, é só criar outra
          aqui.
        </p>
        <FormularioNovaSenha email={email} aoSalvar={`Senha salva. Da próxima vez, entre com ${email} e essa senha.`} />
      </div>
    </section>
  );
}
