import type { CommandModule } from "../cli/router.js";
import { apiRequest } from "../http/client.js";
import { print, emitBlock } from "../output/toon.js";

const SORT_VALUES = ["relevance", "trending"];

interface SearchResponse {
  results: unknown[];
}

export const portalSearch: CommandModule = {
  spec: {
    name: "portal search",
    summary: "Search published datasets on the Collectshare portal",
    flags: [
      { name: "q", type: "string", description: "search query" },
      { name: "sort", type: "string", values: SORT_VALUES, description: "sort order" },
    ],
    examples: ["axi portal search --q census", "axi portal search --sort trending"],
  },
  async run(parsed) {
    const q = parsed.flags["q"] as string | undefined;
    const sort = parsed.flags["sort"] as string | undefined;

    const { results } = await apiRequest<SearchResponse>("v1/portal/search", {
      query: { q, sort },
      requiredScope: "portal:read",
    });

    if (results.length === 0) {
      print(`portal: 0 results found${q ? ` for '${q}'` : ""}`);
      return 0;
    }

    print(emitBlock("results", results.map((r) => JSON.stringify(r))));
    return 0;
  },
};
