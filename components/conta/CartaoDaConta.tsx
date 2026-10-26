"use client";

import Link from "next/link";
import { LogIn, LogOut } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { sair } from "@/lib/sessao";

// No topo da Minha conta: quem está logada, ou o convite para entrar
export function CartaoDaConta({ sessao }: { sessao: Session | null | undefined }) {
  if (sessao === undefined) return null; // ainda verificando

  if (sessao) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-blush px-5 py-4">
        <p>
          Você entrou como <strong>{sessao.user.email}</strong>
        </p>
        <button
          type="button"
          onClick={() => sair()}
          className="flex h-11 items-center gap-2 rounded-xl px-3 font-bold hover:bg-white"
        >
          <LogOut size={18} aria-hidden /> Sair
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-blush px-5 py-4">
      <p>Entre com seu e-mail para salvar seus dados e usar em qualquer aparelho.</p>
      <Link
        href="/entrar"
        className="flex h-11 items-center gap-2 rounded-xl bg-framboesa px-4 font-bold text-white hover:bg-framboesa-escura"
      >
        <LogIn size={18} aria-hidden /> Entrar
      </Link>
    </div>
  );
}
