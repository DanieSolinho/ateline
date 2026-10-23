// "123.456.789-09" → "12345678909"
export function somenteDigitos(texto: string): string {
  return texto.replace(/\D/g, "");
}

// Confere os dois dígitos verificadores do CPF (a regra oficial da Receita Federal)
export function cpfValido(cpf: string): boolean {
  const digitos = somenteDigitos(cpf);
  if (digitos.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digitos)) return false; // 000.000.000-00, 111.111.111-11…

  const numeros = digitos.split("").map(Number);

  function digitoVerificador(quantos: number): number {
    let soma = 0;
    for (let i = 0; i < quantos; i++) {
      soma += numeros[i] * (quantos + 1 - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  }

  return digitoVerificador(9) === numeros[9] && digitoVerificador(10) === numeros[10];
}

// Celular ou fixo brasileiro com DDD: 10 ou 11 dígitos
export function telefoneValido(telefone: string): boolean {
  const digitos = somenteDigitos(telefone);
  return digitos.length === 10 || digitos.length === 11;
}