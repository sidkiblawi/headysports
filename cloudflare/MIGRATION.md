# HeadySports: migrate to the owner's Cloudflare account

Status: prepared and tested locally, not deployed. The existing OpenAI Sites deployment and DNS are unchanged.

Destination account: `9ab190a0293698f9d4fc3f6d8375200f`.
Initial moderator: `sidkiblawi@gmail.com`.
Squarespace remains the domain registrar. Cloudflare will manage DNS for Workers custom domains.

## Authorization and account setup

Use a Cloudflare API token supplied securely as `CLOUDFLARE_API_TOKEN` in the Cloud environment, never in chat, source control, command arguments, or configuration files. Set the non-secret `CLOUDFLARE_ACCOUNT_ID` to the account above. Verify with `npx wrangler whoami`.

For provisioning/deploying, the token needs the account's Workers Scripts, D1, and Workers R2 Storage edit permissions. If automating DNS/custom-domain setup, grant Zone read, DNS edit, and Workers Routes edit on headysports.com. For automated Access configuration, grant the account's Access Apps and Policies edit permission; configure the Zero Trust team and email identity provider in the dashboard if those permissions are unavailable. Keep token scope restricted to this account and zone.

R2 and Workers features may require account billing setup. Check Cloudflare's pricing and limits before enabling paid services.

## Prepare the Worker

1. Install dependencies with `npm run install:ci`.
2. Run `node scripts/cloudflare.mjs init`. This creates ignored `.cloudflare/config.json`; it contains account-specific configuration, never tokens.
3. Create a new EMPTY D1 database named `headysports` and an R2 bucket named `headysports-backups` in the destination account. Record the real D1 database ID in `.cloudflare/config.json`. Do not point this config at the Sites database.
4. Set up Cloudflare Zero Trust email one-time PIN sign-in. Create an Access self-hosted application for the staging hostname covering both `/admin` (including descendants) AND `/api/admin` (including descendants). Require the exact email `sidkiblawi@gmail.com`, with no public bypass policy. If using separate applications for these paths, include both audience values, comma-separated, in `CF_ACCESS_AUD`.
5. Set `CF_ACCESS_TEAM_DOMAIN` to the real `<team>.cloudflareaccess.com`, and `CF_ACCESS_AUD` to the Access application audience(s) in the ignored config. The domain must be only the hostname, without https or a slash.
6. Supply `COMMUNITY_VOTE_SECRET` as a Worker secret. Preserve the existing Sites value if available through the owner's secure configuration; it is needed to recognize previous voter hashes. Do not expose it in code or chat. If it cannot be recovered, decide how to preserve/freeze pre-migration votes before cutover; a new secret preserves old counts but cannot recognize old hashes.
7. Run `node scripts/cloudflare.mjs dry-run`, then `node scripts/cloudflare.mjs deploy` after the real resource and Access IDs are configured. The script builds with the account-specific configuration and refuses placeholders for deployment. Set Worker secrets on the `headysports` Worker, not on the Sites deployment.

The Worker remains public for browsing and submission. Admin pages AND admin APIs verify Cloudflare Access RS256 JWT signatures, issuer, audience, expiry, subject, and allowed email. User-supplied OpenAI identity headers are stripped on Cloudflare. Direct workers.dev access cannot bypass these checks. Without configured Access or a valid JWT, admin access is blocked. Existing Sites auth remains available only when not building/running in the Cloudflare mode.

Legacy sign-in links redirect to `/admin`, where Access must supply the email login challenge. Legacy sign-out links redirect to Cloudflare Access logout. Do not rely on the workers.dev preview URL for successful email sign-in unless that exact hostname is covered by Access; use an Access-protected staging custom hostname for full testing.

## Move the data without changing IDs

The preliminary read-only export is in ignored `.migration-private/database.json`. It contains all six user tables, including pending/rejected records, original IDs, source links, versions, and community votes. It is private data: never commit it or include it in a public PR. It is not a live replication feed or a transactional snapshot.

Run `node scripts/migration-sql.mjs` to create `.migration-private/database.sql` and its manifest. The converter restores the full schema and rows in an in-memory SQLite database, checks row counts and foreign keys, and emits SQL for a NEW EMPTY D1 database only. It is not an incremental migration or a safe command to rerun against populated production.

Before importing, independently verify the target account, database name, and UUID. Use the real target UUID with Wrangler's D1 execute command and `--remote --file .migration-private/database.sql`. Never run the import on the live Sites database. Compare all six target table counts, IDs, and foreign-key checks against the manifest after import.

The database export does not include R2 object contents. While signed in to the old review desk, list/download all cloud snapshots from Backups & restore (following all pages), and copy them into the new private R2 bucket under their original object keys. Verify keys, sizes, and content hashes. A new DB snapshot does not replace historical backups. The repository currently uses R2 for these backups; inspect the current deployment for any additional uploaded files before concluding the object transfer is complete.

## Acceptance checks before cutover

- Browse the homepage, songs, games, and existing sighting URLs; verify the IDs and slugs match the old site.
- Verify suggestions, required fields, duplicates, aliases, repeat moments, and concurrent submissions using disposable staging data.
- Sign in as the allowlisted email using a real email code. Try an unapproved email. Signed-out and forged-header requests to every admin API must fail.
- Publish/reject/edit a disposable staging entry, create/download an R2 backup, and verify a confirmation vote. Test exports and a restore preview.
- Verify `COMMUNITY_VOTE_SECRET` continuity or the agreed frozen-vote strategy.
- Confirm current database and all R2 objects have been copied. An earlier preliminary export is insufficient if anyone has submitted since it was taken.

Local verification commands: `node tests/cloudflare-access.mjs`, `node tests/submission-duplicates.mjs`, `node tests/moderation-validation.mjs`, and `npx tsc --noEmit`.

## DNS and final cutover

Do not remove the existing Squarespace records or detach the Sites custom domain during preparation.

Add headysports.com as a Cloudflare zone and inspect the imported records against a full Squarespace DNS export, not just screenshots. Preserve any mail, TXT, verification, and unrelated subdomain records. Cloudflare will provide the exact nameservers; these cannot be inferred from the account ID. Change only the authoritative nameservers in Squarespace when the imported zone is ready. The registrar stays Squarespace. Review DNSSEC/DS settings before a nameserver change so a stale DS record does not make the domain fail validation.

Initially preserve existing website destinations and confirm the old site still works after the nameserver move. OpenAI's old host already uses Cloudflare infrastructure; check external-hostname/CNAME restrictions rather than assuming proxied records will work. Use DNS-only records during this intermediate phase if required.

At the agreed cutover window, temporarily stop new submissions, votes, and admin changes on the old app, take a fresh complete DB export plus final R2 delta, import and verify it on the destination, then attach both headysports.com and www.headysports.com as Worker custom domains. Remove/replace only the old conflicting website records at this point; Cloudflare supplies the new routing records automatically. Configure Access for both production hostnames before opening admin sign-in. Verify TLS, both hostnames, canonical redirects, existing deep links, and write actions, then reopen submissions.

Keep the old Site and a verified export available through the rollback window, but block writes there so the two copies cannot diverge. Do not delete old DNS verification TXT records until the new hosting is confirmed and rollback is no longer needed. If rolling back after any writes reached the new site, reconcile the data first; changing DNS alone would lose those updates.

No nameserver, DNS, custom-domain, or traffic switch has been executed by this preparation work.
