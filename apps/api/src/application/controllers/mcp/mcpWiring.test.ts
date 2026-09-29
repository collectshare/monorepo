import 'reflect-metadata';

import { describe, expect, it } from 'vitest';

import { ToolRegistry } from '@application/mcp/ToolRegistry';
import { Registry } from '@kernel/di/Registry';

import { McpController } from './McpController';

describe('MCP dependency injection wiring', () => {
  it('resolves the controller with its whole tool tree', () => {
    const controller = Registry.getInstance().resolve(McpController);

    expect(controller).toBeInstanceOf(McpController);
    expect((controller as any).mcpDispatcher).toBeDefined();
    expect((controller as any).mcpDispatcher.toolRegistry).toBeInstanceOf(ToolRegistry);
  });

  it('resolves a registry exposing all eight tools', () => {
    const registry = Registry.getInstance().resolve(ToolRegistry);

    expect(registry.list()).toHaveLength(8);
  });
});
