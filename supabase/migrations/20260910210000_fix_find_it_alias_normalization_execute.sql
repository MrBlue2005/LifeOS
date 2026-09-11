begin;

grant execute on function public.normalize_find_it_alias_display(text) to authenticated;
grant execute on function public.normalize_find_it_alias(text) to authenticated;

commit;
