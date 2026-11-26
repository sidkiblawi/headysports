# Migration status

Staging: https://headysports.headysports-sidkiblawi.workers.dev

- Cloudflare account: 9ab190a0293698f9d4fc3f6d8375200f.
- Worker: headysports; static assets served before the application, with no static files under protected admin paths.
- D1: f878b724-d812-418f-b47e-4c449468c832 (headysports).
- R2: headysports-backups, private; 41 historical snapshots copied and verified by key, byte size, and ETag.
- Database snapshot: 44 sightings, 31 songs, 31 events, 26 sources, 26 community votes, 1 archive settings record. References validated after import.
- Existing community confirmation secret transferred securely to the new Worker; never saved in the repository or displayed in chat.
- Access team: jolly-resonance-cd51.cloudflareaccess.com. Staging app: 6be0d57d-9649-49d5-93b8-fa54f8604165. Reusable email allowlist policy: 719bf0af-fee3-4128-aeda-c2ca34f35395. Only sidkiblawi@gmail.com is allowed, using email one-time codes.
- Owner confirmed the staging review queue loads after email sign-in.
- Headless browser: homepage, required-field validation, existing game suggestions, duplicate prompt, repeat-moment field, and anonymous/forged-header admin rejection passed with no browser JavaScript errors.
- Active DNS zone: 661c0d2adb78a053596b2b7b55ed0af1. Existing security/verification TXT and Domain Connect records were preserved; the website now routes to the owner’s Worker.
- Assigned nameservers: christina.ns.cloudflare.com and viddy.ns.cloudflare.com.
- DNSSEC is active with Cloudflare’s signing key and matching Squarespace parent DS record. A public validating resolver returned AD=true during the November 26 handoff check. Do not reuse the old Squarespace signing record.

## Production cutover completed

- Squarespace DNSSEC was disabled by the owner. Google and Cloudflare resolvers confirmed no parent DS record before the nameserver change.
- The owner changed nameservers to christina.ns.cloudflare.com and viddy.ns.cloudflare.com; the Cloudflare zone is active.
- Both headysports.com and www.headysports.com are attached to the headysports Worker with HTTPS. Only the three old website A/CNAME records were replaced; security/verification TXT and Domain Connect records remain.
- Access now covers both production hostnames and the staging hostname. The audience and exact moderator email allowlist are unchanged.
- The legacy Sites app was placed in read-only mode before the final data comparison. All six tables match the destination byte-for-byte after canonicalization and SHA-256 comparison. Legacy source version: de555d2e9e4a8ca5a74b7b1f9088dc1a163121fa; deployment appgdep_6b063eebe0108191b2061168b009f966. MIGRATION_READ_ONLY=1 prevents source writes.
- Production browser checks passed on both hostnames: homepage 200, required fields, existing-game suggestions, duplicate prompt, repeat-moment field, anonymous admin redirect, forged identity-header rejection, zero JavaScript errors.
- The temporary data exporter was removed and its two runtime credentials deleted before cutover. Its path returns 404.

## Follow-up and rollback

Some recursive resolvers cached the old website A records with the previous four-hour TTL. Those visitors can temporarily reach the old read-only copy; they must retry writes once their DNS cache refreshes. Leave the legacy write block enabled to avoid split data. Do not delete the old Site or private snapshots during this propagation/rollback window.

DNSSEC has been restored: key tag 2371, algorithm 13, digest type 2. Cloudflare reports active. See HANDOFF.md for the public DS digest and the current operating procedure.

For rollback, preserve all writes now accepted by the Cloudflare D1 database; compare and reconcile them before returning traffic to the old copy. Simply restoring old DNS and unblocking the old database would discard post-cutover changes. The old Site is retained, not removed.

## Plugin deployment note

The connected Cloudflare plugin handles account resource management and Worker multipart uploads. Its documented request helper cannot supply the temporary asset-upload Authorization JWT; a direct workspace HTTPS client uploaded static assets with the purpose-limited upload JWT returned by Cloudflare. No long-lived API token was required. Then the Worker was uploaded through the plugin using the completion JWT. Each completion JWT is single-use; create a new assets upload session for subsequent deployments. The packaging helper builds the module/asset payload without exports or secrets.
