import { getDb } from "./annotation-db.ts";

export interface QuickComment {
  id: number;
  text: string;
  sortOrder: number;
}

export function listQuickComments(): QuickComment[] {
  return getDb()
    .query("SELECT id, text, sort_order as sortOrder FROM quick_comments ORDER BY sort_order ASC, id ASC")
    .all() as QuickComment[];
}

export function replaceQuickComments(items: Array<{ text: string }>): void {
  const database = getDb();
  const insert = database.prepare("INSERT INTO quick_comments (text, sort_order) VALUES (?, ?)");
  database.transaction(() => {
    database.exec("DELETE FROM quick_comments");
    items.forEach((item, i) => insert.run(item.text, i));
  })();
}
