-- Provision the owner as administrator.
--
-- 1. Supabase Dashboard -> Authentication -> Users -> "Add user" (create the owner with a
--    strong password, or send an invite). Then turn OFF public sign-ups in
--    Authentication -> Providers -> Email -> "Allow new users to sign up".
-- 2. Run the statement below in the SQL Editor (it runs as the postgres role, which is
--    the only way to write to admin_users). Replace the email.
--
-- Browsers cannot do this: there is no INSERT policy on public.admin_users.

insert into public.admin_users (user_id)
select id from auth.users where email = 'yuviharsh1234@gmail.com'
on conflict do nothing;

-- Verify:
-- select u.email, a.created_at from public.admin_users a join auth.users u on u.id = a.user_id;
