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
- Pending DNS zone: 661c0d2adb78a053596b2b7b55ed0af1. Eleven existing DNS records copied, preserving the old website destinations, email security TXT records, Domain Connect, and Sites verification records. No registrar changes made.
- Assigned nameservers: christina.ns.cloudflare.com and viddy.ns.cloudflare.com.
- A live parent DS record for the Squarespace DNSSEC keys exists. The owner must disable DNSSEC in Squarespace and removal must be verified before changing nameservers. Do not copy that DS record to the new zone.

## Still needed

1. Completed: the temporary Sites transfer endpoint was removed, its runtime credentials deleted, and the cleanup deployment succeeded. It now returns 404.
2. Have the owner disable Squarespace DNSSEC; verify the parent DS record disappears, allowing for caches.
3. Have the owner replace the four Squarespace nameservers with the two Cloudflare nameservers. Squarespace’s current plugin has no DNS/nameserver management endpoints.
4. Recheck that the Cloudflare zone becomes active and the old site still serves correctly using the preserved records. Compare a complete Squarespace DNS export if the owner has records beyond the screenshots provided.
5. Before routing production to the Worker, prevent divergent writes, refresh the DB and any backup delta if anything changed, configure Access on headysports.com and www, and attach both Worker custom domains. Verify TLS, old deep links, forms, backups, and admin actions, then reopen writes. Keep rollback available.
6. Update this status and merge the migration PR only after production acceptance. Do not delete the old Site or historical data yet.

## Plugin deployment note

The connected Cloudflare plugin handles account resource management and Worker multipart uploads. Its documented request helper cannot supply the temporary asset-upload Authorization JWT; a direct workspace HTTPS client uploaded static assets with the purpose-limited upload JWT returned by Cloudflare. No long-lived API token was required. Then the Worker was uploaded through the plugin using the completion JWT. Each completion JWT is single-use; create a new assets upload session for subsequent deployments. The packaging helper builds the module/asset payload without exports or secrets.
