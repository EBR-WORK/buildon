-- Buildon CMS — close the hole that 0010 missed, and remove its cause.
--
-- WHAT WAS ACTUALLY WRONG
--
-- Not a stray dashboard policy, which is what 0010 and my first draft of this
-- file both assumed. The culprit was in the repo the whole time:
--
--   is_editor()  ->  select exists (select 1 from profiles where id = auth.uid())
--
-- That is "has a profile row", not "may edit". When the project had a single
-- 'admin' role the two sentences meant the same thing, so the name was
-- accurate. 0009 added six roles and the sentences came apart — but the
-- policies kept calling it, so a sales or marketing account still passed.
--
-- 0010 tried to drop policies named "... writable by signed-in users". No such
-- policies exist; the real ones are named "... writable by admins". Dropping a
-- policy that is not there is not an error in Postgres, so 0010 reported
-- success and changed nothing. That is why a sales login could still edit the
-- site after it ran.
--
-- The correct policies from 0010 ARE in place and correct. Only the old
-- permissive ones beside them need to go — RLS policies are OR'd, so the
-- strict policy was decoration next to a permissive one.
--
-- WHY is_editor() IS RENAMED RATHER THAN FIXED
--
-- Two policies use it legitimately: reading `places` and `settings` is for any
-- staff member, not just editors, and presales and sales genuinely need the
-- places list. So the function's BEHAVIOUR is wanted — its name is what caused
-- this bug, by reading as an authorisation check when it is a membership
-- check. It becomes is_staff(), which cannot be misread the same way.

-- ------------------------------------------- the membership check, renamed

create or replace function public.is_staff()
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  -- Membership, NOT permission: true for every account with a profile,
  -- whatever its role. Use it for "is this one of ours", never for "may this
  -- person change something". For that, see can_edit_content(),
  -- can_manage_jobs(), can_see_all_leads(), is_super_admin().
  select exists (select 1 from public.profiles where id = auth.uid());
$$;

-- -------------------------------------- the two legitimate uses, repointed

drop policy if exists "staff read places" on public.places;
create policy "staff read places"
  on public.places for select
  to authenticated
  using (public.is_staff());

drop policy if exists "editors read settings" on public.settings;
create policy "staff read settings"
  on public.settings for select
  to authenticated
  using (public.is_staff());

-- ------------------------------------------------ the over-broad ones, gone
--
-- Each of these sits beside an equivalent policy that checks the role
-- properly, so removing it takes nothing away from a content editor, an admin
-- or a super admin. It only stops everyone else.
--
--   content           "editors write content"  USING can_edit_content()
--   content_versions  "editors read versions"  USING can_edit_content()
--   storage.objects   "editors write media"    USING can_edit_content()

drop policy if exists "content is writable by admins" on public.content;
drop policy if exists "versions are readable by admins" on public.content_versions;
drop policy if exists "media is writable by admins" on storage.objects;

-- The old name goes with them, so it cannot be reached for again. Nothing else
-- references it: no function, no view, no remaining policy.
drop function if exists public.is_editor();

-- ------------------------------------------------------------- what is left
--
-- After this, these tables are governed by exactly:
--
--   content           read: anyone          write: can_edit_content()
--   content_versions  read: can_edit_content()
--   media bucket      read: anyone          write: can_edit_content()
--   applications      insert: anyone (a CV upload)   read: can_manage_jobs()
--                     delete: is_super_admin()
--   places, settings  read: is_staff()      write: is_super_admin()
