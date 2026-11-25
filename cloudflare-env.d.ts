declare namespace Cloudflare {
  interface Env {
    AUTH_PROVIDER?: string;
    CF_ACCESS_TEAM_DOMAIN?: string;
    CF_ACCESS_AUD?: string;
    ADMIN_EMAILS?: string;
    COMMUNITY_VOTE_SECRET?: string;
    DB?: D1Database;
    MODERATOR_EMAIL?: string;
    ARCHIVE_MIGRATION_KEY?: string;
    BUCKET?: R2Bucket;
  }
}
