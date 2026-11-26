-- Cloud First transactional QA only. Synthetic UUIDs, no Auth user creation.
-- Before body: BEGIN, create two fresh disposable schemas, create A.qa_consumer(id integer),
-- grant schema usage to anon/authenticated, SELECT to anon and SELECT/UPDATE to authenticated on qa_consumer.
-- Render/apply Registry 0001-0003 (user_scoped) and IAM 0001-0002 in A; IAM 0001-0002 in B.
-- Replace __A__/__B__ with the two distinct scratch schemas, execute, always ROLLBACK.
-- Verify both namespaces absent separately. SQL role/claim simulation is not signed Auth/REST session validation.

-- Assert fail-closed default; bind admission only for the two synthetic consumer members.
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1"}',true);
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000001',true);
do $$ begin
  if __A__.registry_can_create_entity(auth.uid(),null) is distinct from false or exists(select 1 from __A__.preset_definitions) then raise exception 'default consumer admission leak'; end if;
end $$;
reset role;
create or replace function __A__.registry_consumer_can_access() returns boolean language sql stable security invoker set search_path = pg_catalog as $$
 select auth.uid() in ('20000000-0000-4000-8000-000000000001'::uuid,'20000000-0000-4000-8000-000000000002'::uuid) and not coalesce(auth.jwt()->>'is_anonymous'='true',false);
$$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000003","role":"authenticated","aal":"aal1"}',true);
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000003',true);
do $$ begin
  if __A__.registry_can_create_entity(auth.uid(),null) is distinct from false or exists(select 1 from __A__.preset_definitions) then raise exception 'non-member consumer access'; end if;
  begin
    insert into __A__.entities(entity_type,display_name,owner_user_id) values ('HUMANO','QA unauthorized',auth.uid());
    raise exception 'non-member insert allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

insert into __A__.iam_principals(id,principal_type,provider,provider_subject) values
('10000000-0000-4000-8000-000000000001','human','supabase','20000000-0000-4000-8000-000000000001'),
('10000000-0000-4000-8000-000000000002','human','supabase','20000000-0000-4000-8000-000000000002');
insert into __A__.iam_memberships(id,principal_id,scope_type,scope_id) values
('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','workspace','A'),
('30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','workspace','B');
insert into __A__.iam_roles(id,slug,name) values ('40000000-0000-4000-8000-000000000001','reader','Reader');
insert into __A__.iam_permissions(id,code) values ('50000000-0000-4000-8000-000000000001','qa.read');
insert into __A__.iam_role_permissions(role_id,permission_id) values ('40000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001');
insert into __A__.iam_membership_roles(membership_id,role_id) values ('30000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001'),('30000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000001');
create table __A__.qa_domain(scope_id text primary key);
insert into __A__.qa_domain values ('A'),('B');
alter table __A__.qa_domain enable row level security;
grant select on __A__.qa_domain to authenticated;
create policy qa_read on __A__.qa_domain for select to authenticated using (__A__.iam_has_permission('qa.read','workspace',scope_id,'aal1'));
do $$ begin
  if not has_schema_privilege('anon','__A__','USAGE') or not has_table_privilege('anon','__A__.qa_consumer','SELECT') or not has_table_privilege('authenticated','__A__.qa_consumer','UPDATE') then raise exception 'consumer grants changed'; end if;
  if has_table_privilege('anon','__A__.entities','SELECT') or has_table_privilege('anon','__A__.iam_principals','SELECT') or has_function_privilege('anon','__A__.iam_has_permission(text,text,text,text)','EXECUTE') then raise exception 'anon grants leak'; end if;
  if has_table_privilege('authenticated','__A__.entity_auth_links','SELECT') or has_table_privilege('authenticated','__A__.entity_documents','SELECT') or has_table_privilege('authenticated','__A__.iam_membership_roles','INSERT') or has_column_privilege('authenticated','__A__.entities','owner_user_id','UPDATE') then raise exception 'privileged surface leak'; end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1"}',true);
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000001',true);
do $$ begin
  if __A__.iam_has_permission('qa.read','workspace','A') is distinct from true or __A__.iam_has_permission('qa.read','workspace','B') is distinct from false or __B__.iam_has_permission('qa.read','workspace','A') is distinct from false then raise exception 'IAM A scope/cross-product'; end if;
  if __A__.iam_has_permission('qa.read','workspace','A','aal2') is distinct from false or __A__.iam_has_permission('qa.read','workspace','A','invalid') is distinct from false then raise exception 'AAL failure'; end if;
  if (select count(*) from __A__.qa_domain) <> 1 or not exists(select 1 from __A__.qa_domain where scope_id='A') or (select count(*) from __A__.iam_principals)<>1 then raise exception 'IAM domain or principal isolation'; end if;
  insert into __A__.entities(id,entity_type,display_name,owner_user_id) values ('60000000-0000-4000-8000-000000000001','AGENTE_IA','QA agent','20000000-0000-4000-8000-000000000001');
  insert into __A__.entity_roles(entity_id,role_code) values ('60000000-0000-4000-8000-000000000001','agent'),('60000000-0000-4000-8000-000000000001','partner');
  insert into __A__.agent_profiles(entity_id, function_name, operational_status, preferred_model, allowed_stacks) values ('60000000-0000-4000-8000-000000000001','QA','ready','model-a',array['model-a']);
  if (select count(*) from __A__.entity_roles)<>2 then raise exception 'multi role failure'; end if;
  begin
    update __A__.entities set owner_user_id='20000000-0000-4000-8000-000000000002' where id='60000000-0000-4000-8000-000000000001';
    raise exception 'owner reassignment allowed';
  exception when insufficient_privilege then null; end;
  begin
    insert into __A__.iam_membership_roles(membership_id,role_id) values ('30000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000001');
    raise exception 'role injection allowed';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal2"}',true);
do $$ begin
 if __A__.iam_has_permission('qa.read','workspace','A','aal2') is distinct from true then raise exception 'AAL2 allow failed'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal2","is_anonymous":true}',true);
do $$ begin
 if __A__.iam_has_permission('qa.read','workspace','A') is distinct from false then raise exception 'anonymous sign-in allowed'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal1"}',true);
select set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',true);
do $$ declare n integer; begin
 if __A__.iam_has_permission('qa.read','workspace','A') is distinct from false or __A__.iam_has_permission('qa.read','workspace','B') is distinct from true then raise exception 'IAM B scope'; end if;
 if exists(select 1 from __A__.entities) or exists(select 1 from __A__.agent_profiles) or exists(select 1 from __A__.entity_roles) then raise exception 'Registry B leak'; end if;
 update __A__.entities set display_name='tampered'; get diagnostics n=row_count; if n<>0 then raise exception 'Registry B update'; end if;
end $$;
reset role;
update __A__.iam_memberships set status='revoked' where id='30000000-0000-4000-8000-000000000002';
set local role authenticated;
do $$ begin
 if __A__.iam_has_permission('qa.read','workspace','B') is distinct from false then raise exception 'revocation failure'; end if;
end $$;
reset role;
