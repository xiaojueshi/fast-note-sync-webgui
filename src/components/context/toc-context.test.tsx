import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { TocProvider, useToc } from './toc-context';
import React from 'react';

describe('TocProvider', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TocProvider>{children}</TocProvider>
  );

  it('应提供初始空 headings 数组', () => {
    const { result } = renderHook(() => useToc(), { wrapper });
    expect(result.current.headings).toEqual([]);
    expect(result.current.activeId).toBeNull();
  });

  it('应正确注册标题', () => {
    const { result } = renderHook(() => useToc(), { wrapper });
    const mockElement = document.createElement('h1');

    act(() => {
      result.current.registerHeading({
        id: 'test-heading',
        level: 1,
        text: 'Test Heading',
        element: mockElement,
      });
    });

    expect(result.current.headings).toHaveLength(1);
    expect(result.current.headings[0].id).toBe('test-heading');
  });

  it('应去重相同 id 的标题', () => {
    const { result } = renderHook(() => useToc(), { wrapper });
    const mockElement = document.createElement('h1');

    act(() => {
      result.current.registerHeading({
        id: 'duplicate-id',
        level: 1,
        text: 'First',
        element: mockElement,
      });
      result.current.registerHeading({
        id: 'duplicate-id',
        level: 1,
        text: 'Second',
        element: mockElement,
      });
    });

    expect(result.current.headings).toHaveLength(1);
    expect(result.current.headings[0].text).toBe('First');
  });

  it('应正确注销标题', () => {
    const { result } = renderHook(() => useToc(), { wrapper });
    const mockElement = document.createElement('h1');

    act(() => {
      result.current.registerHeading({
        id: 'to-remove',
        level: 1,
        text: 'To Remove',
        element: mockElement,
      });
    });

    expect(result.current.headings).toHaveLength(1);

    act(() => {
      result.current.unregisterHeading('to-remove');
    });

    expect(result.current.headings).toHaveLength(0);
  });

  it('应正确更新 activeId', () => {
    const { result } = renderHook(() => useToc(), { wrapper });

    act(() => {
      result.current.setActiveId('new-active');
    });

    expect(result.current.activeId).toBe('new-active');
  });

  it('未包裹 Provider 时 useToc 应抛出错误', () => {
    expect(() => {
      renderHook(() => useToc());
    }).toThrow('useToc must be used within a TocProvider');
  });
});
