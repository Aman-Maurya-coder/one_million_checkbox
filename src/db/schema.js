import { pgTable, uuid, varchar, boolean, text, timestamp, PgRefreshMaterializedView } from "drizzle-orm/pg-core";
import { create } from "node:domain";

export const users = pgTable("users", {
    id: uuid('id').primaryKey().defaultRandom(),
    firstName: varchar('first_name', { length: 255 }).notNull(),
    lastName: varchar("last_name", { length: 255 }).notNull(),

    email: varchar("email", { length: 322 }).notNull().unique(),
    
    password: text("password", { length: 66 }),
    salt: text("salt"),
    refreshToken: text("refresh_token"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),

})