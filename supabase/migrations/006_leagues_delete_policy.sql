-- Agrega policy de DELETE faltante en tabla leagues.
-- Sin esta policy, RLS bloqueaba silenciosamente el DELETE
-- aunque el endpoint validara que el caller es el owner.

create policy "leagues_delete"
  on leagues
  for delete
  using (auth.uid() = owner_id);
