do $$ declare existing text; begin
select substring(x from length('pgrst.db_schemas=')+1) into existing from pg_db_role_setting s join pg_roles r on r.oid=s.setrole cross join lateral unnest(s.setconfig) x where r.rolname='authenticator' and s.setdatabase=0 and x like 'pgrst.db_schemas=%';
if existing is distinct from 'public, graphql_public, crm, crm_homolog' then raise exception 'API baseline changed; stop'; end if;
if not exists(select 1 from pg_namespace where nspname='sagb') or exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='sagb' and p.prosecdef) then raise exception 'SagB API not safe'; end if;
execute 'alter role authenticator set pgrst.db_schemas to ' || quote_literal(existing || ', sagb');
end $$;
notify pgrst, 'reload config';
notify pgrst, 'reload schema';
