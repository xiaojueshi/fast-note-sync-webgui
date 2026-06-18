/**
 * 将标题文本规范化为适合用作锚点的 slug。
 *
 * @param text - 原始标题文本
 * @returns 规范化后的 slug；若文本为空则返回兜底值 `section`
 */
export function createHeadingSlug(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'section';
}

/**
 * 创建当前文档作用域内的标题 ID 生成器。
 * 相同标题会按出现顺序追加数字后缀；若提供稳定 key，则同一标题节点在重复渲染时会复用同一个 ID。
 *
 * @returns 标题 ID 生成函数
 */
export function createHeadingIdGenerator(): (text: string, stableKey?: string) => string {
  const headingCounts = new Map<string, number>();
  const cachedIds = new Map<string, string>();

  /**
   * 为标题文本生成唯一锚点 ID。
    *
    * @param text - 标题文本内容
    * @param stableKey - 可选的稳定节点标识；传入后可在重复渲染时复用同一个 ID
    * @returns 当前文档内唯一的标题 ID
    */
  return (text: string, stableKey?: string): string => {
    if (stableKey) {
      const existingId = cachedIds.get(stableKey);
      if (existingId) {
        return existingId;
      }
    }

    const baseId = createHeadingSlug(text);
    const nextCount = (headingCounts.get(baseId) ?? 0) + 1;
    const id = nextCount === 1 ? baseId : `${baseId}-${nextCount - 1}`;

    headingCounts.set(baseId, nextCount);

    if (stableKey) {
      cachedIds.set(stableKey, id);
    }

    return id;
  };
}
