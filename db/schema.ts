import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
export const sightings = sqliteTable("sightings", {
 id: integer("id").primaryKey({autoIncrement:true}), song:text("song").notNull(), artist:text("artist").notNull(), game:text("game").notNull(), sport:text("sport").notNull(), network:text("network").notNull(), date:text("date").notNull(), source:text("source").notNull(), notes:text("notes").notNull().default(""), createdAt:text("created_at").notNull()
});
