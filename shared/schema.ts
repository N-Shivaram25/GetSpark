import { sql } from "drizzle-orm";
import { pgTable, text, varchar, json, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const keywords = pgTable("keywords", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  keyword: text("keyword").notNull(),
  used: boolean("used").default(false),
});

export const imgKeyMappings = pgTable("img_key_mappings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  keyword: text("keyword").notNull(),
  imageUrls: json("image_urls").$type<string[]>().notNull(),
  duration: integer("duration").default(6),
  bulletPoints: boolean("bullet_points").default(false),
});

export const insertKeywordSchema = createInsertSchema(keywords).omit({
  id: true,
});

export const insertImgKeyMappingSchema = createInsertSchema(imgKeyMappings).omit({
  id: true,
});

export type InsertKeyword = z.infer<typeof insertKeywordSchema>;
export type Keyword = typeof keywords.$inferSelect;

export type InsertImgKeyMapping = z.infer<typeof insertImgKeyMappingSchema>;
export type ImgKeyMapping = typeof imgKeyMappings.$inferSelect;
