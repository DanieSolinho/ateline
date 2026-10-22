export type Reserva = {
  codigo: string; // código do bolo reservado
  festa: string;  // data da festa no formato "2026-10-25"
};

export type Periodo = {
  retirada: string;
  festa: string;
  devolucao: string;
};