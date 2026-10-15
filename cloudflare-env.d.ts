declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    MODERATOR_EMAIL?: string;
    BUCKET?: R2Bucket;
  }
}
