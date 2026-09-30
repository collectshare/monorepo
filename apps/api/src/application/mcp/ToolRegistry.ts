import { Injectable } from '@kernel/decorators/Injectable';

import { McpTool, McpToolDefinition } from './McpTool';
import { CreateFormTool } from './tools/CreateFormTool';
import { GetDatasetDataTool } from './tools/GetDatasetDataTool';
import { GetFormSubmissionsTool } from './tools/GetFormSubmissionsTool';
import { GetFormTool } from './tools/GetFormTool';
import { InsertQuestionsTool } from './tools/InsertQuestionsTool';
import { ListFormsTool } from './tools/ListFormsTool';
import { SearchDatasetsTool } from './tools/SearchDatasetsTool';
import { UpdateFormTool } from './tools/UpdateFormTool';

@Injectable()
export class ToolRegistry {
  private readonly tools: Map<string, McpTool>;

  constructor(
    listFormsTool: ListFormsTool,
    getFormTool: GetFormTool,
    createFormTool: CreateFormTool,
    updateFormTool: UpdateFormTool,
    insertQuestionsTool: InsertQuestionsTool,
    getFormSubmissionsTool: GetFormSubmissionsTool,
    searchDatasetsTool: SearchDatasetsTool,
    getDatasetDataTool: GetDatasetDataTool,
  ) {
    const tools: McpTool[] = [
      listFormsTool,
      getFormTool,
      createFormTool,
      updateFormTool,
      insertQuestionsTool,
      getFormSubmissionsTool,
      searchDatasetsTool,
      getDatasetDataTool,
    ];

    this.tools = new Map(tools.map(tool => [tool.name, tool]));
  }

  list(): McpToolDefinition[] {
    return [...this.tools.values()].map(tool => tool.definition);
  }

  get(name: string): McpTool | undefined {
    return this.tools.get(name);
  }
}
