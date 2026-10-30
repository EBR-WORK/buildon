# What this project does

buildon.co.in — a marketing site for Buildon Plasters, with its own admin
panel and an automatic Marathi and Hindi translation of every page.

One line each. Written for somebody who has not seen the code.

---

## The site

| | |
|---|---|
| Static export | Next.js builds every page to plain HTML; no server runs in production. |
| Public pages | Home, About, Products, Projects, Clientele, Testimonials, Blog, FAQ, Career, Contact, Search, Catalogue download, Privacy, User agreement. |
| City landing pages | A page per city Buildon sells in — Ranchi, Jamshedpur, Bhubaneswar, Cuttack, Durgapur, Siliguri, Jharkhand, Orissa. |
| Detail pages | Every product, project, blog post and job opening gets its own page, generated from the database. |
| Search | Searches the site's own content, in the browser, with no search service behind it. |
| Enquiry forms | Contact and product enquiries, plus job applications with a résumé upload. |

## Languages

| | |
|---|---|
| Three languages | English at `/`, Marathi at `/mr`, Hindi at `/hi` — 96 pages each. |
| Nothing is translated twice | Every translated sentence is stored against its English original, so a page that has not changed costs nothing to rebuild. |
| New content translates itself | An editor publishes in English; the next build finds the new sentences and translates only those. |
| Product names stay readable | A short list of names stays in Latin script — `Buildon`, `Bondit-151`, `P-20`, ISO, IGBC — so a dealer still recognises the bag. |
| Three Gemini models on one key | The free tier allows 20 requests a day per model, so the translator moves to the next model when one is spent, and to Azure if a key is set. |
| A check that reads the pages | `npm run i18n:check` reads the finished Marathi and Hindi pages and reports any English left on them. |
| Correct one by hand | A translation edited directly in the database is marked and never overwritten by the machine. |

## Admin panel

| | |
|---|---|
| Where | `/admin`, behind a login. |
| Edits the site's content | Home, Products, Projects, Blog, FAQs, Careers, Team, Branches. |
| Rich text editor | Headings, lists, links, images and video, with the same formatting the page will show. |
| Media picker | Offers the images and videos already in the project rather than asking for a path. |
| Leads | Every enquiry that comes in, assignable to a salesperson, with an archive. |
| Presales tracker | Follow-up state on a lead after it has been assigned. |
| Applications | Job applications with their résumés. |
| Roles | Owner, admin and staff see different things; some actions are owner-only. |
| Invite by email | A new admin is invited by email rather than given a password. |
| Publishing | Saving in the admin panel rebuilds and deploys the live site on its own, at most once every 5 minutes. |

## Behind it

| | |
|---|---|
| Database | Supabase — content, leads, applications, admins, settings and the translation cache. |
| Migrations | 28 numbered SQL files; the schema is reproducible from an empty database. |
| Enquiry → CRM | A new enquiry is forwarded to Odoo, where it becomes a CRM lead. |
| Email | Password resets and notifications are sent as Buildon, not as Supabase. |
| Content in the repo | Published content is also committed as JSON, so the site still builds if the database is unreachable. |
| Hosting | Netlify, built from the `stagging` branch. |

## Commands

| | |
|---|---|
| `npm run dev` | Dev server, with the content watcher beside it so admin edits appear as you work. |
| `npm run build` | Pull content, index media, build, translate. |
| `npm run preview` | Serve the built site the way Netlify will — the only way to see translations locally. |
| `npm run db:check` | Is the database reachable and is the schema there? |
| `npm run db:migrate` | Apply the SQL migrations. |
| `npm run db:pull` / `db:push` | Move content between the database and the repo. |
| `npm run db:status` | Do the committed files still match the database? |
| `npm run db:watch` | Keep the committed content in step while you work. |
| `npm run db:admin` | List, invite and remove admins. |
| `npm run db:prune` | Find uploaded files nothing points at any more. |
| `npm run media` | Re-index `public/` for the admin's pickers. |
| `npm run i18n:pages` | Translate the built site. |
| `npm run i18n:pages -- --stale` | Re-send only the translations that still read as English. |
| `npm run i18n:check` | Report English left on a translated page. |
| `npm run i18n:routes` | Generate the `/mr` and `/hi` route trees from the English one. |
| `npm run check:richdoc` | Does a post survive a trip through the editor unchanged? |

## Automation

| | |
|---|---|
| Daily translation | A scheduled job picks up anything the previous day's quota could not reach, at 14:00 IST. |
| Publish on save | A database trigger asks Netlify for a build when an editor publishes. |
