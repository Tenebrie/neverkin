import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

const TOOL_NAME = 'readme'

export function registerReadmeTool(server: McpServer) {
	server.registerTool(
		TOOL_NAME,
		{
			title: 'Readme',
			description: 'Provides detailed usage instructions. Always read this at the start of a session.',
			annotations: {
				readOnlyHint: true,
				idempotentHint: true,
			},
		},
		() => {
			const entries = [
				[
					'**Basic overview:**',
					'- This set of tools allows you to interact with Timelines, an advanced note-taking and worldbuilding app.',
					'- In Neverkin you will encounter the following entities:',
					'  - Worlds are projects that contain all other entities. No cross-world communication is possible.',
					'  - Actors are characters, items, artifacts. They can typically move around, have relationships, be involved with events.',
					'  - Events are entities that happen at a specific point in time. They ALWAYS have a timestamp, and they may also have duration or end date.',
					'  - Articles are just text documents with anything that you would like to store there.',
					'  - Tags are labels you can mention in actor/article content to create queryable groupings.',
					'  - Pages are extra hidden pages of content for the entity. Query and update pages separately. Trying to create a page that does not exist will create it.',
					'',
					'**Principles:**',
					'- Names over IDs. Use human readable names to find or create entities. Avoid slugs. Only mentions are exception.',
					'- Fuzzy matching. A unique partial string match is sufficient to find an entity.',
					'- For actors, main content is your summary. Use pages to add more details. The list of pages will be displayed when you read the actor.',
					'- Use mentions generously. Mentions handle expansion and inject extra content automatically.',
					'- First paragraph of content is your summary. Summary will be included automatically whenever the entity is mentioned or searched.',
					"- Keep data normalized. Store each fact in one place. Don't restate details inside other entities.",
					"- Use tags for cross-cutting groupings you'll want to query later (e.g. everyone of a faction, every entity in an episode). Mention a tag in content to add an entity to it.",
					"- Avoid name collisions. Keep each entity uniquely named. Fuzzy matching will throw when it can't resolve precisely.",
					'- Create related entities in one `create_entities` call. Entities are created before content is written, so content may mention any entity in the batch.',
					'',
					'**Getting started:**',
					'1. Use the `list_worlds` tool to see available worlds.',
					'2. Use the `set_context` tool to select a world to work in, if necessary.',
					'3. Use `get_world_details` tool to query the current world state.',
					'',
					'**Main tools:**',
					'- `search_world`: Find string matches across names and content.',
					'- `create_entities`: Create any number of actors, events, articles and tags in one call.',
					'- `get_entity_details`: Fetch details and content of an actor, event or article.',
					'- `update_entity_content`: Set or edit main content or pages of an actor, event or article.',
				],
			]

			return {
				content: entries.map((entry) => ({
					type: 'text' as const,
					text: entry.join('\n'),
				})),
			}
		},
	)
}
