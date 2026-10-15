-- Buildon CMS — remove the policies that make the new ones pointless.
--
-- Row level security policies are OR'd. Adding a strict policy beside a loose
-- one does not narrow anything: a request passes if ANY policy lets it
-- through, so the loose one decides for everybody and the strict one is
-- decoration.
--
-- That is what was happening. 0001 opened writes to any signed-in account,
-- which was correct while the only accounts were editors. 0009 added policies
-- that ask what the account's role is — and they were being OR'd with
-- "authenticated may write", so a salesperson could still edit the website.
-- Caught by signing in as one and trying it; reading the policy list would not
-- have shown it, because each policy on its own looks right.
--
-- 0002 was supposed to have dropped these. The file that should have said so
-- was committed empty, so nobody could see that it had not.

drop policy if exists "content is writable by signed-in users" on public.content;
drop policy if exists "media is writable by signed-in users"   on storage.objects;

-- The version history is the content, one edit ago. Same rule.
drop policy if exists "versions are readable by signed-in users" on public.content_versions;
drop policy if exists "editors read versions" on public.content_versions;
create policy "editors read versions"
  on public.content_versions for select
  to authenticated
  using (public.can_edit_content());

-- Re-asserted here so this file alone is enough to leave the database correct,
-- whatever order anything else ran in.
drop policy if exists "editors write content" on public.content;
create policy "editors write content"
  on public.content for all
  to authenticated
  using (public.can_edit_content())
  with check (public.can_edit_content());

drop policy if exists "editors write media" on storage.objects;
create policy "editors write media"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'media' and public.can_edit_content())
  with check (bucket_id = 'media' and public.can_edit_content());
