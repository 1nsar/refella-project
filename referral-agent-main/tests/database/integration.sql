\set ON_ERROR_STOP on
begin;
insert into auth.users(id) values ('10000000-0000-0000-0000-000000000001'),('10000000-0000-0000-0000-000000000002');
insert into businesses(id,owner_id,name) values
('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Synthetic A'),
('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','Synthetic B');
insert into campaigns(business_id,version,name,reward_units,min_purchase_minor,terms) values
('20000000-0000-0000-0000-000000000001',1,'Demo',100,1000,'Synthetic fixed units'),
('20000000-0000-0000-0000-000000000002',1,'Demo',200,1000,'Synthetic fixed units');
insert into customers(id,business_id,channel,external_id) values
('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','demo','referrer'),
('30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','demo','friend'),
('30000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000002','demo','friend');
set local role service_role;
do $$
declare a uuid:='20000000-0000-0000-0000-000000000001'; b uuid:='20000000-0000-0000-0000-000000000002';
 sender uuid:='30000000-0000-0000-0000-000000000001'; friend uuid:='30000000-0000-0000-0000-000000000002'; outsider uuid:='30000000-0000-0000-0000-000000000003';
 invite jsonb; claim jsonb; req jsonb; result jsonb; cancelled jsonb; lowreq jsonb; nextreq jsonb;
begin
 invite:=api_create_invite(a,sender);
 assert invite=api_create_invite(a,sender),'invite retry changed';
 begin perform api_claim_invite(a,sender,invite->>'token'); raise exception 'TEST self accepted'; exception when others then if sqlerrm<>'self_referral' then raise; end if; end;
 begin perform api_claim_invite(b,outsider,invite->>'token'); raise exception 'TEST foreign token accepted'; exception when others then if sqlerrm<>'invite_not_found' then raise; end if; end;
 begin perform api_create_request(a,outsider,'Cut',null,'foreign'); raise exception 'TEST foreign customer accepted'; exception when foreign_key_violation then null; end;
 claim:=api_claim_invite(a,friend,invite->>'token');
 assert claim=api_claim_invite(a,friend,invite->>'token'),'claim retry changed';
 cancelled:=api_create_request(a,friend,'Cut',null,'cancel');
 perform api_cancel_request(a,(cancelled->>'request_id')::uuid);
 begin perform api_confirm_purchase(a,(cancelled->>'request_id')::uuid,'cancelled-event',2000); raise exception 'TEST cancelled accepted'; exception when others then if sqlerrm<>'request_cancelled' then raise; end if; end;
 lowreq:=api_create_request(a,friend,'Cut',null,'low');
 result:=api_confirm_purchase(a,(lowreq->>'request_id')::uuid,'low-event',500);
 assert (result->>'reward_units')::bigint=0,'below threshold rewarded';
 req:=api_create_request(a,friend,'Cut',null,'first');
 assert req=api_create_request(a,friend,'Cut',null,'first'),'request retry changed';
 begin perform api_create_request(a,friend,'Other',null,'first'); raise exception 'TEST conflicting request accepted'; exception when others then if sqlerrm<>'idempotency_conflict' then raise; end if; end;
 begin perform api_confirm_purchase(b,(req->>'request_id')::uuid,'foreign-event',2000); raise exception 'TEST foreign request accepted'; exception when others then if sqlerrm<>'request_not_found' then raise; end if; end;
 result:=api_confirm_purchase(a,(req->>'request_id')::uuid,'first-event',2000);
 assert (result->>'reward_units')::bigint=100,'eligible purchase not rewarded';
 assert result=api_confirm_purchase(a,(req->>'request_id')::uuid,'first-event',2000),'purchase replay differs';
 begin perform api_confirm_purchase(a,(req->>'request_id')::uuid,'first-event',3000); raise exception 'TEST amount conflict accepted'; exception when others then if sqlerrm<>'idempotency_conflict' then raise; end if; end;
 begin perform api_cancel_request(a,(req->>'request_id')::uuid); raise exception 'TEST purchased cancelled'; exception when others then if sqlerrm<>'already_purchased' then raise; end if; end;
 nextreq:=api_create_request(a,friend,'Cut',null,'second');
 begin perform api_confirm_purchase(a,(nextreq->>'request_id')::uuid,'first-event',2000); raise exception 'TEST event reused'; exception when others then if sqlerrm<>'idempotency_conflict' then raise; end if; end;
 result:=api_confirm_purchase(a,(nextreq->>'request_id')::uuid,'second-event',2000);
 assert (result->>'reward_units')::bigint=0,'second purchase rewarded';
 assert (select count(*) from reward_ledger where business_id=a)=1,'duplicate ledger';
 begin update reward_ledger set reward_units=999 where business_id=a; raise exception 'TEST ledger changed'; exception when others then if sqlerrm<>'financial_history_immutable' then raise; end if; end;
 begin delete from reward_ledger where business_id=a; raise exception 'TEST ledger deleted'; exception when others then if sqlerrm<>'financial_history_immutable' then raise; end if; end;
 begin update conversions set amount_minor=999 where business_id=a; raise exception 'TEST conversion changed'; exception when others then if sqlerrm<>'financial_history_immutable' then raise; end if; end;
 begin delete from conversions where business_id=a; raise exception 'TEST conversion deleted'; exception when others then if sqlerrm<>'financial_history_immutable' then raise; end if; end;
 begin truncate reward_ledger; raise exception 'TEST ledger truncated'; exception when insufficient_privilege then null; end;
 begin update campaigns set reward_units=999 where business_id=a; raise exception 'TEST rules changed'; exception when others then if sqlerrm<>'campaign_rules_immutable' then raise; end if; end;
 raise notice 'PASS: tenant constraints, cancellation, self-referral, first eligible purchase, idempotency, immutable rules';
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
do $$ begin
 assert (select count(*) from businesses)=1,'owner sees other business';
 assert (select count(*) from customers)=2,'owner sees other customers';
 begin perform api_create_invite('20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001'); raise exception 'TEST owner rpc allowed'; exception when insufficient_privilege then null; end;
 begin update customers set display_name='forbidden'; raise exception 'TEST owner write allowed'; exception when insufficient_privilege then null; end;
 raise notice 'PASS: owner RLS and mutation denial';
end $$;
reset role;
set local role anon;
do $$ begin
 begin perform api_create_invite('20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001'); raise exception 'TEST anon rpc allowed'; exception when insufficient_privilege then null; end;
 begin perform count(*) from customers; raise exception 'TEST anon read allowed'; exception when insufficient_privilege then null; end;
 raise notice 'PASS: anon denied';
end $$;
rollback;
