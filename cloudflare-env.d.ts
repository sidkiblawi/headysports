declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    MODERATOR_EMAIL?: string;
    ARCHIVE_MIGRATION_KEY?: string;
    BUCKET?: R2Bucket;
  }
}
