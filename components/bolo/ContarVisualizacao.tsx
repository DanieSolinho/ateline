"use client";

import { useEffect } from "react";
import { registrarVisualizacao } from "@/lib/visualizacoes";

// Não mostra nada: só avisa o banco que este bolo foi visto (para o relatório "mais vistos")
export function ContarVisualizacao({ codigo }: { codigo: string }) {
  useEffect(() => {
    registrarVisualizacao(codigo);
  }, [codigo]);
  return null;
}
