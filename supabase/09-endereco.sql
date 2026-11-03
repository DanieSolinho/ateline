-- =====================================================================
-- Ateline · Endereço da cliente em "Meus dados"
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run".
-- Precisa do arquivo 02 já rodado. Pode rodar de novo sem problema.
--
-- O endereço vai no contrato de locação. Fica na tabela "perfis",
-- que só a própria cliente consegue ler e alterar (regras do arquivo 02).
-- =====================================================================

alter table public.perfis add column if not exists cep text;
alter table public.perfis add column if not exists rua text;
alter table public.perfis add column if not exists numero text;
alter table public.perfis add column if not exists complemento text;
alter table public.perfis add column if not exists bairro text;
alter table public.perfis add column if not exists cidade text;
alter table public.perfis add column if not exists uf text;

-- Limites de formato e tamanho (refeitos a cada execução)
alter table public.perfis drop constraint if exists perfis_endereco_valido;
alter table public.perfis add constraint perfis_endereco_valido check (
  (cep is null or cep ~ '^[0-9]{8}$')
  and (uf is null or uf ~ '^[A-Z]{2}$')
  and char_length(coalesce(rua, '')) <= 160
  and char_length(coalesce(numero, '')) <= 20
  and char_length(coalesce(complemento, '')) <= 80
  and char_length(coalesce(bairro, '')) <= 80
  and char_length(coalesce(cidade, '')) <= 80
);
