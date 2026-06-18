import { describe, expect, it } from 'vitest';

import { createHeadingIdGenerator, createHeadingSlug } from './heading-id';

describe('heading-id', () => {
  it('应将标题文本规范化为稳定 slug', () => {
    expect(createHeadingSlug('Hello World')).toBe('hello-world');
    expect(createHeadingSlug('中文 标题')).toBe('中文-标题');
    expect(createHeadingSlug('   ')).toBe('section');
  });

  it('应为重复标题生成递增后缀', () => {
    const getHeadingId = createHeadingIdGenerator();

    expect(getHeadingId('Same Title')).toBe('same-title');
    expect(getHeadingId('Same Title')).toBe('same-title-1');
    expect(getHeadingId('Same Title')).toBe('same-title-2');
  });

  it('同一内容重新创建生成器后应保持锚点稳定', () => {
    const firstRenderGenerator = createHeadingIdGenerator();
    const secondRenderGenerator = createHeadingIdGenerator();

    expect(firstRenderGenerator('Same Title')).toBe('same-title');
    expect(secondRenderGenerator('Same Title')).toBe('same-title');
  });

  it('同一生成器在重复渲染相同标题列表时应返回相同结果', () => {
    const getHeadingId = createHeadingIdGenerator();
    const headings = [
      { text: 'Same Title', key: '1:1' },
      { text: 'Another Title', key: '2:1' },
      { text: 'Same Title', key: '3:1' },
    ];

    const firstRenderIds = headings.map(heading => getHeadingId(heading.text, heading.key));
    const secondRenderIds = headings.map(heading => getHeadingId(heading.text, heading.key));

    expect(firstRenderIds).toEqual(['same-title', 'another-title', 'same-title-1']);
    expect(secondRenderIds).toEqual(firstRenderIds);
  });

  it('未提供稳定 key 时应继续为重复标题生成递增后缀', () => {
    const getHeadingId = createHeadingIdGenerator();

    expect(getHeadingId('Same Title')).toBe('same-title');
    expect(getHeadingId('Same Title')).toBe('same-title-1');
  });
});
