import { describe, expect, it } from 'vitest';
import React from 'react';
import { MainLayout } from '../src/components/layout/MainLayout';

describe('Layout Architecture Fixes (AC 1 & AC 2)', () => {
  describe('MainLayout requirements (AC 1)', () => {
    it('uses standard flex h-screen w-screen overflow-hidden wrapper', () => {
      const child = React.createElement('div', { id: 'test-child' }, 'Hello World');
      const element = MainLayout({ children: child });

      expect(React.isValidElement(element)).toBe(true);
      if (React.isValidElement<{ className?: string }>(element)) {
        expect(element.props.className).toContain('flex h-screen w-screen overflow-hidden bg-gray-100');
      }
    });

    it('uses flex-1 overflow-y-auto on content container for scroll isolation', () => {
      const child = React.createElement('div', { id: 'test-child' }, 'Hello World');
      const element = MainLayout({ children: child });

      expect(React.isValidElement(element)).toBe(true);
      if (React.isValidElement<{ children: React.ReactNode }>(element)) {
        const childrenArray = React.Children.toArray(element.props.children);
        expect(childrenArray.length).toBe(2);

        const contentColumn = childrenArray[1];
        expect(React.isValidElement(contentColumn)).toBe(true);
        if (React.isValidElement<{ children: React.ReactNode }>(contentColumn)) {
          const mainElement = contentColumn.props.children;
          expect(React.isValidElement(mainElement)).toBe(true);
          if (React.isValidElement<{ className?: string }>(mainElement)) {
            expect(mainElement.props.className).toContain('flex-1 overflow-y-auto');
          }
        }
      }
    });
  });
});

