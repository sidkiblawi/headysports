# Managing the HeadySports archive

Open `/admin` and sign in with the owner ChatGPT account. Access is restricted to the address configured by the private `MODERATOR_EMAIL` environment setting.

Use **Add appearance** to enter a song, artist, event, broadcast date, network, cue type and evidence. Add one or more source links. Drafts and pending submissions remain private; choose Published to show an entry immediately. Editing content does not require a deployment. Concurrent edits are detected; reload before retrying a stale edit.

Evidence labels distinguish broadcast clips, published reporting and unverified fan reports. Public submissions always enter the pending queue with the fan label. Review the actual sources before publishing or changing that label.

Songs and games have their own pages, and every published appearance has a shareable page. The sitemap includes published records only. The database is the public site's source of truth; `lib/seed-archive.ts` is solely a one-time import of the original researched entries.

## Backups

Owner edits and imports save a private cloud JSON snapshot before writing. **Save cloud backup** creates an additional snapshot. Download JSON for a portable archive, or CSV for spreadsheets. Keep occasional downloaded copies outside the hosting account. Snapshots are stored in the private `BUCKET` binding; they are not public media.

Restore accepts the exported version-1 JSON format (up to 500 entries and 3 MB per file). Preview the changes, then explicitly confirm the restore. Matching stable record keys update entries; entries absent from the file remain in the database. A snapshot is saved first. Large restores use batches, so an interrupted restore may have saved some batches; review the result before retrying. This is a content backup, not a complete hosting/account backup.

## Development

Run the starter's local preview with mock authentication, then `python3 tests/catalog_integration.py`. The integration test mutates only the local preview database and verifies owner access, publishing, validation, public/private isolation, optimistic concurrency, exports and restore. Never point it at production.

D1 schema migrations live in `drizzle/`. The private `ARCHIVE_MIGRATION_KEY` is a temporary bootstrap credential for `/api/admin/initialize`; initialization is idempotent and closes token-based migration after its database marker is written. Normal administration uses owner sign-in.
