-- Service-only mutations. The server must authenticate channel/staff context.
create extension if not exists pgcrypto;

create table public.businesses (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id),
 name text not null, created_at timestamptz not null default now()
);
create table public.campaigns (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id),
 version integer not null check(version > 0), name text not null, active boolean not null default true,
 reward_units bigint not null check(reward_units > 0), min_purchase_minor bigint not null default 1 check(min_purchase_minor > 0),
 terms text not null, created_at timestamptz not null default now(),
 unique(business_id,id), unique(business_id,version)
);
create unique index campaigns_one_active on public.campaigns(business_id) where active;
create function public.protect_campaign_rules() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if (new.business_id,new.version,new.reward_units,new.min_purchase_minor,new.terms) is distinct from
    (old.business_id,old.version,old.reward_units,old.min_purchase_minor,old.terms) then
   raise exception 'campaign_rules_immutable';
 end if;
 return new;
end $$;

create trigger campaigns_immutable before update on public.campaigns for each row execute function public.protect_campaign_rules();
create table public.customers (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id),
 channel text not null, external_id text not null, display_name text,
 created_at timestamptz not null default now(), unique(business_id,id), unique(business_id,channel,external_id)
);
create table public.referral_invites (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id),
 campaign_id uuid not null, referrer_id uuid not null,
 token text not null unique default encode(gen_random_bytes(24),'hex'), created_at timestamptz not null default now(),
 unique(business_id,id), unique(business_id,campaign_id,referrer_id),
 foreign key(business_id,campaign_id) references public.campaigns(business_id,id),
 foreign key(business_id,referrer_id) references public.customers(business_id,id)
);
create table public.referrals (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id),
 invite_id uuid not null, campaign_id uuid not null, referrer_id uuid not null, referred_id uuid not null,
 created_at timestamptz not null default now(), check(referrer_id <> referred_id),
 unique(business_id,id), unique(business_id,referred_id),
 foreign key(business_id,invite_id) references public.referral_invites(business_id,id),
 foreign key(business_id,campaign_id) references public.campaigns(business_id,id),
 foreign key(business_id,referrer_id) references public.customers(business_id,id),
 foreign key(business_id,referred_id) references public.customers(business_id,id)
);
create table public.booking_requests (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id),
 customer_id uuid not null, service text not null check(length(trim(service)) > 0), preferred_time timestamptz,
 request_key text not null check(length(trim(request_key)) > 0),
 status text not null default 'requested' check(status in ('requested','cancelled','purchased')),
 created_at timestamptz not null default now(), unique(business_id,id), unique(business_id,request_key),
 foreign key(business_id,customer_id) references public.customers(business_id,id)
);
create table public.conversions (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id),
 request_id uuid not null, customer_id uuid not null, external_event_id text not null check(length(trim(external_event_id)) > 0),
 amount_minor bigint not null check(amount_minor > 0), created_at timestamptz not null default now(),
 result jsonb not null, unique(business_id,id), unique(business_id,request_id), unique(business_id,external_event_id),
 foreign key(business_id,request_id) references public.booking_requests(business_id,id),
 foreign key(business_id,customer_id) references public.customers(business_id,id)
);
create table public.reward_ledger (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id),
 conversion_id uuid not null, referral_id uuid not null, customer_id uuid not null, referred_id uuid not null,
 reward_units bigint not null check(reward_units > 0), created_at timestamptz not null default now(),
 unique(business_id,conversion_id), unique(business_id,referred_id), unique(business_id,referral_id),
 foreign key(business_id,conversion_id) references public.conversions(business_id,id),
 foreign key(business_id,referral_id) references public.referrals(business_id,id),
 foreign key(business_id,customer_id) references public.customers(business_id,id),
 foreign key(business_id,referred_id) references public.customers(business_id,id)
);

create function public.protect_financial_history() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin raise exception 'financial_history_immutable'; end $$;
create trigger conversions_immutable before update or delete on public.conversions for each row execute function public.protect_financial_history();
create trigger reward_ledger_immutable before update or delete on public.reward_ledger for each row execute function public.protect_financial_history();

create function public.api_create_invite(p_business_id uuid,p_customer_id uuid) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare c campaigns; i referral_invites;
begin
 select * into c from campaigns where business_id=p_business_id and active;
 if not found then raise exception 'no_active_campaign'; end if;
 insert into referral_invites(business_id,campaign_id,referrer_id) values(p_business_id,c.id,p_customer_id)
 on conflict(business_id,campaign_id,referrer_id) do update set referrer_id=excluded.referrer_id returning * into i;
 return jsonb_build_object('invite_id',i.id,'token',i.token,'campaign_id',c.id,'version',c.version,'reward_units',c.reward_units,'terms',c.terms);
end $$;

create function public.api_claim_invite(p_business_id uuid,p_customer_id uuid,p_token text) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare i referral_invites; r referrals;
begin
 perform 1 from customers where business_id=p_business_id and id=p_customer_id for update;
 if not found then raise exception 'customer_not_found'; end if;
 select * into i from referral_invites where business_id=p_business_id and token=p_token;
 if not found then raise exception 'invite_not_found'; end if;
 if i.referrer_id=p_customer_id then raise exception 'self_referral'; end if;
 select * into r from referrals where business_id=p_business_id and referred_id=p_customer_id;
 if found then
   if r.invite_id<>i.id then raise exception 'already_attributed'; end if;
   return jsonb_build_object('referral_id',r.id,'status','claimed','referrer_id',r.referrer_id);
 end if;
 if not exists(select 1 from campaigns where id=i.campaign_id and business_id=p_business_id and active) then raise exception 'campaign_inactive'; end if;
 if exists(select 1 from conversions where business_id=p_business_id and customer_id=p_customer_id) then raise exception 'existing_customer_purchase'; end if;
 insert into referrals(business_id,invite_id,campaign_id,referrer_id,referred_id)
 values(p_business_id,i.id,i.campaign_id,i.referrer_id,p_customer_id) returning * into r;
 return jsonb_build_object('referral_id',r.id,'status','claimed','referrer_id',r.referrer_id);
end $$;

create function public.api_create_request(p_business_id uuid,p_customer_id uuid,p_service text,p_preferred_time timestamptz,p_request_key text) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare r booking_requests;
begin
 insert into booking_requests(business_id,customer_id,service,preferred_time,request_key)
 values(p_business_id,p_customer_id,p_service,p_preferred_time,p_request_key)
 on conflict(business_id,request_key) do nothing returning * into r;
 if not found then
 select * into r from booking_requests where business_id=p_business_id and request_key=p_request_key;
 if (r.customer_id,r.service,r.preferred_time) is distinct from (p_customer_id,p_service,p_preferred_time) then raise exception 'idempotency_conflict'; end if;
 end if;
 return jsonb_build_object('request_id',r.id,'status',r.status,'service',r.service,'preferred_time',r.preferred_time);
end $$;

create function public.api_cancel_request(p_business_id uuid,p_request_id uuid) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare r booking_requests;
begin
 select * into r from booking_requests where business_id=p_business_id and id=p_request_id for update;
 if not found then raise exception 'request_not_found'; end if;
 if r.status='purchased' then raise exception 'already_purchased'; end if;
 update booking_requests set status='cancelled' where id=r.id;
 return jsonb_build_object('request_id',r.id,'status','cancelled');
end $$;

create function public.api_confirm_purchase(p_business_id uuid,p_request_id uuid,p_external_event_id text,p_amount_minor bigint) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare r booking_requests; v conversions; f referrals; c campaigns; result jsonb; conversion_id uuid:=gen_random_uuid(); units bigint:=0;
begin
 if p_amount_minor is null or p_amount_minor<=0 or p_external_event_id is null or length(trim(p_external_event_id))=0 then raise exception 'invalid_purchase'; end if;
 -- ponytail: tenant-wide lock intentionally limits throughput; replace only after measured contention.
 -- Serialize tenant events and customer first-purchase decisions, including event reuse on another request.
 perform 1 from businesses where id=p_business_id for update;
 if not found then raise exception 'business_not_found'; end if;
 select * into v from conversions where business_id=p_business_id and external_event_id=p_external_event_id;
 if found then
   if v.request_id<>p_request_id or v.amount_minor<>p_amount_minor then raise exception 'idempotency_conflict'; end if;
   return v.result;
 end if;
 select * into r from booking_requests where business_id=p_business_id and id=p_request_id for update;
 if not found then raise exception 'request_not_found'; end if;
 if r.status='cancelled' then raise exception 'request_cancelled'; end if;
 if r.status='purchased' then raise exception 'already_purchased'; end if;
 perform 1 from customers where business_id=p_business_id and id=r.customer_id for update;
 select * into f from referrals where business_id=p_business_id and referred_id=r.customer_id;
 if found then
   if f.referrer_id=r.customer_id then raise exception 'self_referral'; end if;
   select * into c from campaigns where business_id=p_business_id and id=f.campaign_id;
   if p_amount_minor>=c.min_purchase_minor and not exists(select 1 from reward_ledger where business_id=p_business_id and referred_id=r.customer_id) then units:=c.reward_units; end if;
 end if;
 result:=jsonb_build_object('conversion_id',conversion_id,'request_id',r.id,'status','purchased','reward_units',units,'rewarded_customer_id',case when units>0 then f.referrer_id else null end);
 insert into conversions(id,business_id,request_id,customer_id,external_event_id,amount_minor,result)
 values(conversion_id,p_business_id,r.id,r.customer_id,p_external_event_id,p_amount_minor,result);
 if units>0 then
 insert into reward_ledger(business_id,conversion_id,referral_id,customer_id,referred_id,reward_units)
 values(p_business_id,conversion_id,f.id,f.referrer_id,r.customer_id,units);
 end if;
 update booking_requests set status='purchased' where id=r.id;
 return result;
end $$;

do $$ declare t text; f record; begin
 foreach t in array array['businesses','campaigns','customers','referral_invites','referrals','booking_requests','conversions','reward_ledger'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 if t='businesses' then
 execute 'create policy owner_read on public.businesses for select to authenticated using (owner_id=auth.uid())';
 else
 execute format('create policy owner_read on public.%I for select to authenticated using (exists (select 1 from public.businesses b where b.id=business_id and b.owner_id=auth.uid()))',t);
 end if;
 end loop;
 for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and (p.proname like 'api\_%%' escape '\' or p.proname in ('protect_campaign_rules','protect_financial_history')) loop
 execute format('revoke all on function %s from public, anon, authenticated',f.signature);
 execute format('grant execute on function %s to service_role',f.signature);
 end loop;
end $$;
revoke truncate on public.conversions, public.reward_ledger from service_role;
