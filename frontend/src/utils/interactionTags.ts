export type InteractionTagSource =
  | string
  | string[]
  | Array<{ tag_name?: string; name?: string } | string | null | undefined>
  | null
  | undefined;

/**
 * 將後端回傳的互動標籤格式統一為字串陣列
 * - 支援 JSON 字串（例如 '["雙十","周年慶"]'）
 * - 支援逗號分隔字串（例如 '雙十, 周年慶'）
 * - 支援 { tag_name } 物件陣列
 * - 自動去除空值與重複值
 */
export function normalizeInteractionTags(raw: InteractionTagSource): string[] {
  if (!raw) {
    return [];
  }

  const pushTag = (tag: unknown, target: Set<string>) => {
    if (typeof tag === 'string') {
      const trimmed = tag.trim();
      if (trimmed) {
        target.add(trimmed);
      }
      return;
    }

    if (tag && typeof tag === 'object') {
      const value =
        typeof (tag as any).tag_name === 'string'
          ? (tag as any).tag_name
          : typeof (tag as any).name === 'string'
            ? (tag as any).name
            : undefined;
      if (value) {
        pushTag(value, target);
      }
    }
  };

  const tags = new Set<string>();

  if (Array.isArray(raw)) {
    raw.forEach((item) => pushTag(item, tags));
    return Array.from(tags);
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) {
      return [];
    }

    // 嘗試解析 JSON 字串
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        parsed.forEach((item) => pushTag(item, tags));
        return Array.from(tags);
      }
    } catch {
      // 不是合法 JSON，改用分隔符處理
    }

    trimmed
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => tags.add(item));

    return Array.from(tags);
  }

  pushTag(raw, tags);
  return Array.from(tags);
}
