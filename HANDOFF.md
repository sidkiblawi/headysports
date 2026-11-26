# HeadySports — independent agent handoff

Prepared November 26, 2026 (America/Chicago). This document is intended to let another developer or LLM agent continue the project without this conversation or a ChatGPT subscription. Resource IDs and application audience values below identify infrastructure; they are not credentials. No passwords, API tokens, private data rows, login cookies, or secret values are included.

## 1. Start here: what is live

HeadySports is a community archive of jam-band songs heard on sports broadcasts. The owner is Sid Kiblawi; the authorized moderator email is sidkiblawi@gmail.com.

- Production: https://headysports.com and https://www.headysports.com.
- Admin review desk: https://headysports.com/admin.
- Code: https://github.com/sidkiblawi/headysports, branch main; public repository.
- Migration PR: https://github.com/sidkiblawi/headysports/pull/1 (merged).
- Migration merge commit: b85a904ce7911e848725fb3139a426f3f47a9ec0. Fetch current main; later commits may supersede it.
- The application runs in the OWNER'S Cloudflare account, not OpenAI Sites or GitHub Pages.
- Squarespace is the domain registrar. Cloudflare manages authoritative DNS and hosting.
- Admin authentication is Cloudflare Access email one-time codes, restricted to the owner's email. It no longer requires ChatGPT sign-in.
- No LLM inference or OpenAI API is used by the current submission, moderation, duplicate, or hosting flows.
- ChatGPT's Cloudflare/GitHub connections were operational tools, not runtime dependencies. Another agent can use its own authorized Cloudflare/GitHub clients.

Live checks performed for this handoff: homepage returned HTTP 200; Cloudflare zone and DNSSEC reported active; a public validating resolver returned DNS status 0 with AD=true. D1 contained 45 sightings and 26 community-vote rows. The private R2 archive prefix listed 42 backup objects. These counts are observations, not invariants; new users can change them.

## 2. Important owner preferences and product rules

Keep the existing branding, content, URLs, IDs, slugs, and community evidence model. Avoid junk submissions and duplicate queue entries. Do not automatically merge uncertain matches, change song identities, or upgrade evidence based on an LLM guess.

- Public submissions require song, artist, game/event, sport, and network, in both browser and API validation.
- Date, source URL, and notes are optional. The submission date uses a native calendar input and defaults to the visitor's local day. Network defaults to FOX and stays editable.
- New submissions enter pending review and are immediately eligible for the public Pending/community section, unless hidden by a moderator. Published appearances belong in the archive, not Pending.
- Evidence labels: Fan report, Broadcast clip, Published reporting. Published entries also display Confirmed by moderators. A moderator decision is distinct from the underlying evidence type.
- A source-free Fan report may be published. Clip/reporting evidence requires at least one valid URL and source title with a matching source type. Admins must still be able to reject older incomplete entries.
- Five confirmations for the current entry version earn Community corroborated. The admin queue displays its badge before review. This does not automatically publish an entry.
- Public submissions are rate-limited using an IP-derived hash; votes have browser/network deduplication and hourly limits. Existing policy can prevent several people on one Wi-Fi network from counting as separate voters; review that tradeoff explicitly before changing it.

## 3. Duplicate prevention and event matching

Implementation: lib/submission-duplicates.ts, lib/event-matching.ts, app/api/sightings/route.ts, app/api/submission-options/route.ts, and app/home.tsx.

Matching uses normalized song, artist, date, sport, and event identity. Case and repeated whitespace are normalized. Curated, sport-scoped MLB/NFL/NBA team names, nicknames, and abbreviations recognize reversed pairings such as LAD @ MIL and Brewers vs Dodgers. Game numbers and other event qualifiers are preserved. Unknown sports/names stay conservative.

A matching submission returns HTTP 409 with safe existing-sighting details. The UI offers Heard it too and sends a confirmation to the existing record rather than creating a queue duplicate. Possible matches with different event wording ask Is this the same game? Users may reject an uncertain match with Not the same game. A confident match cannot be bypassed with that choice.

A Different broadcast moment submission requires an explicit timing detail. Its note is prefixed with Broadcast moment. The deterministic submission external_key plus the database's unique index prevents simultaneous equivalent submissions from creating multiple rows. The write batch gates source changes on the newly generated version, preventing a conflict from overwriting another entry's sources.

Game suggestions come from public/approved or public pending rows for the selected date, filtered by selected sport in the form. Private or rejected content is not exposed. Artist aliases, general typo correction, and automatic Instagram chat ingestion were discussed but are NOT implemented. Do not assume they exist.

## 4. Infrastructure inventory

| Resource | Identifier or value |
| --- | --- |
| Cloudflare account | 9ab190a0293698f9d4fc3f6d8375200f |
| Worker | headysports |
| Zone: headysports.com | 661c0d2adb78a053596b2b7b55ed0af1 |
| D1 database name | headysports |
| D1 database UUID / DB binding | f878b724-d812-418f-b47e-4c449468c832 |
| Private R2 bucket / BUCKET binding | headysports-backups |
| Worker static-assets binding | ASSETS |
| Secondary URL, SAME Worker and production data | https://headysports.headysports-sidkiblawi.workers.dev |
| Access team domain | jolly-resonance-cd51.cloudflareaccess.com |
| Access application | 6be0d57d-9649-49d5-93b8-fa54f8604165 |
| Reusable moderator policy | 719bf0af-fee3-4128-aeda-c2ca34f35395 |
| Email-code identity provider | 6bad3411-babe-4bb3-a298-0576f9232619 |
| Access application audience | 854c69e239bb2ca60e25464faa536e1526cd0e378c7c404da2cab607c52db1ca |
| Authoritative nameserver 1 | christina.ns.cloudflare.com |
| Authoritative nameserver 2 | viddy.ns.cloudflare.com |

The workers.dev URL was used for staging but is NOT an isolated test environment. It shares the production D1 and R2 bindings. Do not create junk submissions or run destructive tests there.

## 5. Stack and source map

The app uses TypeScript, React 19, Next-style App Router routes on Vinext, Vite, Cloudflare Workers, D1/SQLite, R2, and Drizzle schema/migrations. Use the committed package-lock.json and pinned package versions; do not casually upgrade the framework or adapter during maintenance. Package engine is Node >=22.13; Node 24 was used for verification. Some tests and the full-database converter use node:sqlite.

- app/home.tsx: archive UI and public submission modal.
- app/community.tsx and lib/community.ts: public Pending list and confirmations.
- app/admin/queue.tsx: moderation, editing, backup, and restore UI.
- app/api/sightings/route.ts: public archive and submission endpoint.
- app/api/community/route.ts: public confirmations.
- app/api/admin/: authenticated moderation, imports, exports, and backups.
- lib/catalog.ts: D1 queries, record/version writes, song/event identities, and R2 snapshots.
- lib/validation.ts: authoritative required fields, date, URL, evidence, and size rules.
- lib/cloudflare-access.ts: Cloudflare JWT verification and identity sanitization.
- lib/moderation.ts and lib/admin-access.ts: moderator allowlist and same-origin checks.
- build/sites-worker.ts: Worker entry wrapper. Its historical filename does not mean OpenAI hosts production.
- app/chatgpt-auth.ts: historical helper names. On Cloudflare, identity is supplied ONLY after the Worker validates Access. Legacy sign-in links redirect to /admin; sign-out redirects to Cloudflare logout.
- vite.config.ts: builds for the owner's account when HEADY_CLOUDFLARE=1.
- cloudflare/config.example.json: config template, with resource/audience placeholders.
- scripts/cloudflare.mjs: init/build/dry-run/deploy wrapper.
- scripts/cloudflare-plugin-package.mjs: modules/static-asset packaging for API-based deployment.
- scripts/migration-sql.mjs: one-time FULL export-to-SQL converter for a NEW EMPTY database; NOT an incremental production migration tool.
- db/schema.ts and drizzle/: database definitions and migration history.
- cloudflare/MIGRATION.md and cloudflare/STATUS.md: migration and rollback detail. Prefer the current-state sections over historical preparation steps.

README.md retains starter-specific material; this handoff describes current production operation. The .openai/hosting.json and Sites-related wrappers remain for historical compatibility. Do not publish production updates through OpenAI Sites.

## 6. Credentials and authentication boundaries

Required independent access: the owner's Cloudflare account, the GitHub repository, and (only for registrar settings such as nameservers/DS records) the Squarespace account. Configure credentials through the chosen agent environment's secure secret store or a local authorized CLI session. Never paste tokens or passwords into prompts, source files, issue bodies, or logs.

For Cloudflare CLI deployment, use an appropriately scoped Cloudflare API token as CLOUDFLARE_API_TOKEN, or the CLI's own authorized login. Set CLOUDFLARE_ACCOUNT_ID to the account above. Check current permission names and scope: Workers scripts for deployment; D1/R2 for data operations; domain/route permissions for custom domains; Access permissions for login changes. Do not request unrelated account permissions.

Production non-secret vars are AUTH_PROVIDER=cloudflare-access, MODERATOR_EMAIL=sidkiblawi@gmail.com, CF_ACCESS_TEAM_DOMAIN, and CF_ACCESS_AUD from the inventory. COMMUNITY_VOTE_SECRET is a secret binding already stored on the Worker; its value is intentionally omitted here. It was preserved from the old host. Retain it across deployments: rotating it changes voter hashes and can weaken continuity of repeat-voter protection. Another agent normally need not read its value to redeploy while preserving the binding.

The Worker strips incoming oai-authenticated-* headers, validates Access JWT signature/issuer/audience/expiry/subject/email, then sets internal identity headers for existing application helpers. Never trust a caller's asserted email or expose admin routes just because Access is also configured at the edge. Both /admin and /api/admin, including descendants, are protected on both production hostnames and the workers.dev hostname. Do not introduce a bypass policy.

## 7. Clone, configure, test, deploy without ChatGPT

Use a fresh checkout of current main. Review git status and existing environment configuration before modifying anything.

```sh
git clone https://github.com/sidkiblawi/headysports.git
cd headysports
npm run install:ci
node scripts/cloudflare.mjs init
```

Create/review the ignored .cloudflare/config.json with the actual existing resources below. Do NOT create replacement databases/buckets for an ordinary deployment. All values shown are non-secret.

```json
{
  "name": "headysports",
  "account_id": "9ab190a0293698f9d4fc3f6d8375200f",
  "compatibility_date": "2026-05-15",
  "compatibility_flags": ["nodejs_compat"],
  "workers_dev": true,
  "preview_urls": false,
  "vars": {
    "AUTH_PROVIDER": "cloudflare-access",
    "MODERATOR_EMAIL": "sidkiblawi@gmail.com",
    "CF_ACCESS_TEAM_DOMAIN": "jolly-resonance-cd51.cloudflareaccess.com",
    "CF_ACCESS_AUD": "854c69e239bb2ca60e25464faa536e1526cd0e378c7c404da2cab607c52db1ca"
  },
  "d1_databases": [{
    "binding": "DB",
    "database_name": "headysports",
    "database_id": "f878b724-d812-418f-b47e-4c449468c832"
  }],
  "r2_buckets": [{"binding": "BUCKET", "bucket_name": "headysports-backups"}],
  "routes": [
    {"pattern": "headysports.com", "custom_domain": true},
    {"pattern": "www.headysports.com", "custom_domain": true}
  ]
}
```

Then run:

```sh
node tests/cloudflare-access.mjs
node tests/submission-duplicates.mjs
node tests/moderation-validation.mjs
npx tsc --noEmit
node scripts/cloudflare.mjs dry-run
```

After reviewing changes and checking account/resource bindings:

```sh
node scripts/cloudflare.mjs deploy
```

The wrapper sets HEADY_CLOUDFLARE=1, rebuilds, then uses the project's pinned Wrangler with dist/server/wrangler.json. Deploy refuses known placeholders. Plain npm run build defaults to legacy/local configuration: do not blindly deploy that output. Edit source configuration, not generated dist files. Preserve remote secret bindings and verify COMMUNITY_VOTE_SECRET still exists after a deploy.

Browser smoke tests:

```sh
mkdir -p outputs
HEADY_TEST_URL=https://headysports.com node tests/cloudflare-browser.cjs
HEADY_TEST_URL=https://www.headysports.com node tests/cloudflare-browser.cjs
```

That test currently expects Playwright available and Chromium at /usr/bin/chromium; adapt the browser path and dependency installation for another environment. It respects HTTPS_PROXY when supplied and uses Linux container launch arguments. It checks required fields, existing-game suggestions, a duplicate of an existing published row, a required repeat-moment field, and anonymous/forged-header admin rejection. It should not create a new sighting. If live data no longer has a suitable published row with a full date, adapt the fixture or use a separate test database. Do not weaken production validation to make tests pass.

Local legacy Python integration suites assume local preview/auth fixtures; do not point them at production. The workers.dev URL is not a disposable test database. No verified automatic GitHub-push-to-production pipeline was configured; pushing code alone does not deploy the Worker.

## 8. Direct API deployment details and known upload issue

Ordinary independent agents should prefer the pinned Wrangler flow with their own authorized credentials. The migration used the connected Cloudflare API tool because a standalone API token was not configured.

For an API deployment, the proper asset flow is: construct the static manifest; create an assets-upload session; upload its buckets using that session's temporary JWT; obtain the completion JWT; upload the Worker modules with metadata.assets.jwt and the ASSETS binding. Completion JWTs are single-use. Preserve secret_text bindings rather than generating a new vote secret on each upload. Inspect the existing script and settings first.

The plugin's documented cloudflare.request helper could not provide the special asset-upload Authorization JWT. The workaround was a workspace HTTPS client using the purpose-limited upload JWT, with the token passed through hidden stdin and retained only in session memory, then a plugin multipart Worker upload using the completion JWT. No long-lived token was created for that transfer. A future agent may have a different tool implementation; check its current documentation.

Important observed deployment issue: forcing run_worker_first=true caused CSS/JS assets to return 404 and prevented form hydration in this build. Serving matching static assets first (run_worker_first=false) fixed it. Keep all protected admin paths free of static files that could bypass the Worker checks. The packaging helper records that routing setting.

## 9. Database, backups, and recovery

The six application tables are archive_settings, songs, events, sightings, sources, and community_votes. Sightings reference songs/events, sources reference sighting IDs, and community_votes reference sighting IDs plus their version. Preserve IDs, slugs, external_key values, and version semantics; public links depend on them. Admin writes use optimistic version checks and a D1 batch for each entry.

R2 stores private JSON archive snapshots under archive/. Administrative mutations take a cloud snapshot before applying changes; failed backup storage can block edits. Public submissions and votes do not each trigger a full archive snapshot. No independent scheduled full-backup job was verified, so do not assume there is one.

The admin JSON/CSV export and restore flow is designed for archive entries. It is NOT a full substitute for a D1 export of all tables, especially community voter hashes and raw versions. A complete independent backup plan needs both a fresh D1 database export and the R2 objects, in owner-controlled storage. Inspect the installed Wrangler help/current Cloudflare docs for export commands; verify the target account and database UUID before remote operations.

Private migration files existed only in the original workspace under .migration-private/; they were not committed. They may disappear with that workspace and are now stale. Do not depend on them or assume GitHub contains the live database. Export current production before a risky change or before losing access to any workspace.

scripts/migration-sql.mjs validates and emits the full schema and inserts into a new empty database. NEVER run that generated SQL on the populated production D1 database. For ordinary schema evolution, inspect db/schema.ts, drizzle history, and the actual live schema. The original data import included schema SQL, so verify the destination's migration bookkeeping before blindly applying all historical migrations again.

## 10. Migration history, rollback, DNS, and subscription independence

The migration moved 44 sightings, 31 songs, 31 events, 26 sources, 26 community votes, one archive settings row, and 41 historical R2 snapshots. All six source/destination tables matched using canonical SHA-256 comparisons; backup keys, sizes, and ETags matched. The original confirmation secret was transferred securely. A temporary read-only owner-credential export endpoint was then removed and its runtime credentials deleted; /api/admin/transfer returned 404 after cleanup.

The old OpenAI Sites app is appgprj_6ad045c13e048191bebda2211cfa609c, at https://headysports.sidkiblawi.chatgpt.site. It was left read-only with MIGRATION_READ_ONLY=1. It is a historical fallback, NOT the production source of truth. Its frozen database has 44 sightings while the new system now has 45. Do not unfreeze it or point DNS back without first reconciling every post-cutover change from Cloudflare.

The old Site may not remain available after an OpenAI subscription/account change; its retention terms were not independently verified. The migrated production app does not rely on it. Before canceling, download this handoff and any owner-desired private exports from the original workspace. Keep control of Cloudflare, GitHub, Squarespace, and their recovery methods independently of the ChatGPT plugin connections. Cloudflare and domain registration have their own billing/renewals.

Authoritative DNS records are managed in Cloudflare. The obsolete Squarespace DNS screen does not control the domain while Cloudflare's nameservers are delegated. Squarespace still controls registration renewal and parent-level DS records. Domain Connect and email security records were preserved; do not remove email/DNS records indiscriminately when cleaning old hosting references.

DNSSEC is now ACTIVE. Cloudflare signs the zone, and the owner added the matching DS record at Squarespace. Current public verification returned AD=true. The DS identifier below is public, not a credential; re-read the current Cloudflare values before making future changes:

- Key tag: 2371.
- Algorithm: 13 (ECDSA P-256 with SHA-256).
- Digest type: 2 (SHA-256).
- Digest: 9547D377411E6A54FAA6E60D7D19F5988D9EB7A2D60CCB4DC938D403D63D5D5C.

Do not reuse the old Squarespace-generated DS/key pair or change nameservers during an ordinary code deploy. Any future DNS-provider migration needs a coordinated DS/TTL plan. Keep the current working chain unless explicitly migrating DNS again.

## 11. Known limitations and sensible next work

These are review items, not authorization to silently change production:

- Votes are tied to an entry's version. entryStatements generates a new version on edits, including moderation-status changes. Check whether publishing/editing should retain corroboration; current code can stop counting prior-version confirmations without deleting their rows. Add meaningful tests before changing this policy.
- Game alias matching covers curated MLB/NFL/NBA names, not every league, typo, renamed team, or ambiguous city. Game suggestions and uncertain-match review reduce false merges but do not solve all naming variations.
- A public fan report need not include a source. It must keep the Fan report evidence label unless a moderator supplies matching evidence for another label.
- Instagram group-chat automation was only discussed. No authorized Instagram ingestion, paid sports API, or LLM extraction service was built.
- Do not assume a production backup scheduler, CI deploy integration, isolated staging database, alerts, or load testing exists. Establish these only with owner agreement and verify account limits/billing.
- Existing Python preview tests and browser-path assumptions need portability work for other agent environments.
- Prefer small changes and scoped regression checks. Preserve accessible forms, required-field messages, mobile layouts, same-origin checks, backup-before-edit behavior, and private/public separation.

## 12. Suggested first prompt for the next agent

You are taking over HeadySports. Read this entire handoff and the current repository before editing. Production is on the owner's Cloudflare Worker, D1, R2, and Cloudflare Access; Squarespace is only the registrar. Do not deploy to OpenAI Sites, rotate the vote secret, re-import a migration snapshot into production, or modify DNS for ordinary code changes. Verify current main, resource bindings, authentication, and backup state. Ask the owner what change they want, implement the smallest appropriate change, run relevant tests, and deploy using the Cloudflare build path only when authorized. Report what was verified and any remaining limitations. Obtain credentials through secure environment configuration, never chat.
