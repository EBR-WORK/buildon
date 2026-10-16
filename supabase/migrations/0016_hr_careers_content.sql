-- Buildon CMS — let HR manage the careers page, and nothing else.
--
-- THE PROBLEM
--
-- `can_manage_jobs()` is (super_admin, hr), and the HR panel is guarded with
-- it. But job postings are not their own table: they are a row in `content`,
-- keyed 'career', and writing `content` requires `can_edit_content()`, which
-- is (super_admin, content_editor, admin). HR is not in it.
--
-- So an HR account passes the panel guard, opens the careers editor, types a
-- job posting, presses save — and the update matches no policy. A filtered
-- UPDATE is not an error in Postgres: it affects zero rows and returns
-- success. The screen would say saved and nothing would be.
--
-- Nothing is broken today only because no hr profile exists yet. It breaks the
-- first time one is created.
--
-- WHY A SEPARATE GATE RATHER THAN ADDING hr TO can_edit_content()
--
-- Adding hr there is one word and would work, but it would also hand HR the
-- home page, the product pages, the blog and the project case studies. The
-- whole point of the six roles added in 0009 is that a role gets what its job
-- needs. HR needs the careers page. So the grant is scoped to that row.
--
-- RLS policies are OR'd, so this sits beside "editors write content" and adds
-- to it: a content editor keeps everything, HR gains exactly one row.

-- ------------------------------------------------- writing the careers row

create policy "hr writes careers content"
  on public.content for all
  to authenticated
  using (key = 'career' and public.can_manage_jobs())
  with check (key = 'career' and public.can_manage_jobs());

-- ---------------------------------------------- and reading its own history
--
-- The editor shows previous versions so a change can be undone. Without this
-- HR sees an empty history for a page they are responsible for, which reads as
-- "nothing was ever saved" — the same wrong conclusion the silent-save bug
-- above would have produced.
--
-- No INSERT policy is needed: content_versions rows are written by
-- content_record_version(), a security definer trigger, so the write happens
-- with the function owner's rights rather than the editor's.

create policy "hr reads careers history"
  on public.content_versions for select
  to authenticated
  using (key = 'career' and public.can_manage_jobs());

-- ------------------------------------------------------------- what is left
--
--   content           read: anyone
--                     write: can_edit_content(), plus hr for key='career'
--   content_versions  read: can_edit_content(), plus hr for key='career'
--
-- Verify with a role that should NOT get in, rather than one that should:
--
--   begin;
--   select set_config('request.jwt.claims',
--     json_build_object('sub', '<an hr profile id>', 'role', 'authenticated')::text, true);
--   update public.content set data = data where key = 'home';     -- 0 rows
--   update public.content set data = data where key = 'career';   -- 1 row
--   rollback;
