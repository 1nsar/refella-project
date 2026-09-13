-- MANUAL ONLY. Synthetic demo data for a disposable/local or explicitly approved test project.
-- Replace the owner UUID with an existing test auth.users UUID. Never use customer data.
-- psql -v demo_owner_id=YOUR_TEST_AUTH_USER_UUID -f supabase/demo-seed.sql
\set ON_ERROR_STOP on
\if :{?demo_owner_id}
\else
\echo 'Required: -v demo_owner_id=UUID of an existing TEST auth user. No data changed.'
\quit
\endif
begin;
insert into public.businesses(id,owner_id,name)
values('de000000-0000-4000-8000-000000000001',:'demo_owner_id'::uuid,'Synthetic Demo Barbershop');
insert into public.campaigns(business_id,version,name,reward_units,min_purchase_minor,terms)
values('de000000-0000-4000-8000-000000000001',1,'Synthetic referral campaign',100,1000,
'Demo only: referrer receives 100 noncash test units after the referred customer first completes an eligible purchase of at least 1000 minor currency units. Request is not a confirmed booking. No real payouts.');
commit;
