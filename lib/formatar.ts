const formatador = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatarPreco(valor: number) {
  return formatador.format(valor); // 70 → "R$ 70,00"
}
// "21987654321" → "(21) 98765-4321"
export function formatarTelefone(digitos: string) {
  return digitos.replace(/^(\d{2})(\d{4,5})(\d{4})$/, "($1) $2-$3");
}
