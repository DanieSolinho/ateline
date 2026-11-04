"use client";

import { KeyRound } from "lucide-react";
import { FormularioNovaSenha } from "@/components/FormularioNovaSenha";

// Criar ou trocar a senha da equipe, para entrar pelo app instalado no celular
export function SenhaDoApp({ email }: { email: string }) {
  return (
    <details className="group rounded-2xl border border-linha bg-white">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 font-bold [&::-webkit-details-marker]:hidden">
        <KeyRound size={18} aria-hidden /> Senha para o app
        <span className="ml-auto text-sm font-normal text-ameixa-suave group-open:hidden">Criar ou trocar</span>
      </summary>
      <div className="flex flex-col gap-4 border-t border-linha p-4">
        <p className="text-sm text-ameixa-suave">
          No iPhone, o painel instalado na tela de início não recebe o login pelo link do e-mail. Crie uma senha aqui e
          use-a para entrar no app.
        </p>
        <FormularioNovaSenha email={email} aoSalvar={`Senha salva. No app, entre com ${email} e essa senha.`} />
      </div>
    </details>
  );
}
