import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  real,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { createId } from "./id";

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  themeAccent: text("theme_accent"),
  themeBackground: text("theme_background"),
  themeCard: text("theme_card"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const usersRelations = relations(users, ({ many }) => ({
  diagrams: many(diagrams),
  flashcardSets: many(flashcardSets),
  folders: many(folders),
  flashcardProgress: many(flashcardProgress),
}));

export const folders = pgTable(
  "folders",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    name: text("name").notNull(),
    ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [index("folders_owner_name_idx").on(t.ownerId, t.name)],
);

export const foldersRelations = relations(folders, ({ one, many }) => ({
  owner: one(users, { fields: [folders.ownerId], references: [users.id] }),
  diagrams: many(diagrams),
  flashcardSets: many(flashcardSets),
}));

export const diagrams = pgTable(
  "diagrams",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    name: text("name").notNull(),
    ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    visibility: text("visibility").notNull().default("private"),
    folderId: text("folder_id").references(() => folders.id, { onDelete: "set null" }),
    forkedFromId: text("forked_from_id"),
    lastOpenedAt: timestamp("last_opened_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [
    unique("diagrams_owner_name_uniq").on(t.ownerId, t.name),
    index("diagrams_visibility_updated_idx").on(t.visibility, t.updatedAt),
  ],
);

export const diagramsRelations = relations(diagrams, ({ one, many }) => ({
  owner: one(users, { fields: [diagrams.ownerId], references: [users.id] }),
  folder: one(folders, { fields: [diagrams.folderId], references: [folders.id] }),
  forkedFrom: one(diagrams, { fields: [diagrams.forkedFromId], references: [diagrams.id], relationName: "diagramForks" }),
  forks: many(diagrams, { relationName: "diagramForks" }),
  nodes: many(diagramNodes),
  edges: many(diagramEdges),
}));

export const diagramNodes = pgTable(
  "diagram_nodes",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    diagramId: text("diagram_id").notNull().references(() => diagrams.id, { onDelete: "cascade" }),
    nodeId: text("node_id").notNull(),
    kind: text("kind").notNull(),
    label: text("label").notNull(),
    parentId: text("parent_id"),
    expanded: boolean("expanded").notNull().default(false),
    positionX: real("position_x").notNull(),
    positionY: real("position_y").notNull(),
    sizeWidth: real("size_width"),
    sizeHeight: real("size_height"),
    collapsedWidth: real("collapsed_width"),
    collapsedHeight: real("collapsed_height"),
    description: text("description"),
    shape: text("shape"),
    fillColor: text("fill_color"),
    borderStyle: text("border_style"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("diagram_nodes_diagram_idx").on(t.diagramId)],
);

export const diagramNodesRelations = relations(diagramNodes, ({ one }) => ({
  diagram: one(diagrams, { fields: [diagramNodes.diagramId], references: [diagrams.id] }),
}));

export const diagramEdges = pgTable(
  "diagram_edges",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    diagramId: text("diagram_id").notNull().references(() => diagrams.id, { onDelete: "cascade" }),
    edgeId: text("edge_id").notNull(),
    source: text("source").notNull(),
    target: text("target").notNull(),
    kind: text("kind").notNull(),
    label: text("label"),
    lineStyle: text("line_style"),
    arrowStyle: text("arrow_style"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("diagram_edges_diagram_idx").on(t.diagramId)],
);

export const diagramEdgesRelations = relations(diagramEdges, ({ one }) => ({
  diagram: one(diagrams, { fields: [diagramEdges.diagramId], references: [diagrams.id] }),
}));

export const flashcardSets = pgTable(
  "flashcard_sets",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    name: text("name").notNull(),
    description: text("description"),
    ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    visibility: text("visibility").notNull().default("private"),
    folderId: text("folder_id").references(() => folders.id, { onDelete: "set null" }),
    forkedFromId: text("forked_from_id"),
    lastOpenedAt: timestamp("last_opened_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [
    index("flashcard_sets_owner_name_idx").on(t.ownerId, t.name),
    index("flashcard_sets_visibility_updated_idx").on(t.visibility, t.updatedAt),
  ],
);

export const flashcardSetsRelations = relations(flashcardSets, ({ one, many }) => ({
  owner: one(users, { fields: [flashcardSets.ownerId], references: [users.id] }),
  folder: one(folders, { fields: [flashcardSets.folderId], references: [folders.id] }),
  forkedFrom: one(flashcardSets, { fields: [flashcardSets.forkedFromId], references: [flashcardSets.id], relationName: "flashcardSetForks" }),
  forks: many(flashcardSets, { relationName: "flashcardSetForks" }),
  cards: many(flashcards),
  progress: many(flashcardProgress),
}));

export const flashcards = pgTable(
  "flashcards",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    setId: text("set_id").notNull().references(() => flashcardSets.id, { onDelete: "cascade" }),
    cardId: text("card_id").notNull(),
    front: text("front").notNull(),
    back: text("back").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("flashcards_set_idx").on(t.setId)],
);

export const flashcardsRelations = relations(flashcards, ({ one }) => ({
  set: one(flashcardSets, { fields: [flashcards.setId], references: [flashcardSets.id] }),
}));

export const flashcardProgress = pgTable(
  "flashcard_progress",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    setId: text("set_id").notNull().references(() => flashcardSets.id, { onDelete: "cascade" }),
    cardId: text("card_id").notNull(),
    status: text("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [unique("flashcard_progress_user_set_card_uniq").on(t.userId, t.setId, t.cardId)],
);

export const flashcardProgressRelations = relations(flashcardProgress, ({ one }) => ({
  user: one(users, { fields: [flashcardProgress.userId], references: [users.id] }),
  set: one(flashcardSets, { fields: [flashcardProgress.setId], references: [flashcardSets.id] }),
}));
