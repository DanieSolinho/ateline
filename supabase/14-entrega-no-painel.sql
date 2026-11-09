-- =====================================================================
-- 14. Entrega no painel
-- O cartão de saída mostra quando a cliente pediu entrega no endereço (e o bairro),
-- para a equipe lembrar de combinar pelo WhatsApp antes do dia.
-- Rode no SQL Editor do Supabase. Pode rodar mais de uma vez.
-- =====================================================================

create or replace function public.agenda_do_dia(dia date)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.e_da_equipe() then
    raise exception 'SO_EQUIPE';
  end if;

  return coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id', r.id,
        'codigo', r.codigo,
        'festa', r.festa,
        'retirada', r.retirada,
        'devolucao', r.devolucao,
        'origem', r.origem,
        'retiradoEm', r.retirado_em,
        'devolvidoEm', r.devolvido_em,
        'taxaDevolvida', r.taxa_devolvida,
        'pedido', case when p.id is null then null else jsonb_build_object(
          'id', p.id,
          'numero', p.numero,
          'status', p.status,
          'nome', p.cliente ->> 'nome',
          'whatsapp', p.cliente ->> 'whatsapp',
          'chavePix', p.cliente ->> 'chavePix',
          -- aluguel com entrega no endereço (a loja combina pelo WhatsApp se atende o bairro)
          'entrega', p.cliente ->> 'entrega',
          'bairro', p.cliente ->> 'bairro',
          'itens', p.itens
        ) end
      )
      order by r.retirada, r.codigo
    )
    from public.reservas r
    left join public.pedidos p on p.id = r.pedido_id
    where (r.guardada_ate is null or r.guardada_ate > now())
      and (
        r.retirada = dia
        or r.devolucao = dia
        -- atrasadas: já saíram, já deviam ter voltado e ainda não voltaram
        or (r.devolucao < dia and r.retirado_em is not null and r.devolvido_em is null)
      )
  ), '[]'::jsonb);
end;
$$;

revoke execute on function public.agenda_do_dia(date) from public, anon;
grant execute on function public.agenda_do_dia(date) to authenticated;
