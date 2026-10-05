# Neverkin — AI Context & Architecture Guide

**Last Updated**: October 03, 2026
**Project**: Collaborative worldbuilding and timeline management app for writers, GMs and worldbuilders.
Hobby project, single developer, no revenue and no dev team. Scope advice accordingly.

## Working Agreement

I keep ownership of this codebase: I must be able to read, understand and maintain every line you write. Be a helpful assistant, not a vibe coder.

**Questions are not instructions.**
- A question gets an answer, not an edit. "Why X?", "What causes Y?", "How would you do Z?": explain, then stop.
- Answer the exact question first, in plain words. If you don't know, say so.
- Change code only when told to. "Great", "ok" or "sure" after a list of options is not approval of all of them; ask which.
- Describing a problem ("X is broken", "help fix X?") asks for a diagnosis: explain the cause and the fix you'd make, then wait. Edit once I say go.
- Once I've said "do it", "fix it" or "apply", finish it. Don't ask again, don't stop at a workaround, don't leave a bug you found yourself listed as "not fixed".

**Scope.**
- Do what was asked, the narrow version. No renames, moved code or "while I was there" changes. Follow established patterns. Flag adjacent dead code or latent bugs in one line, then stop.
- No refactors, new architecture, features or design changes unless asked. Propose first; I decide.
- Never trade visuals, UX or behaviour for performance (or the reverse) on your own. Present the tradeoff. A proposal that makes the product worse is not a fix.
- Never discard work (revert, stash, checkout, delete) unless I ask. "Not viable" is my judgement of a result, not an instruction to delete it.
- Avoid dangerous operations. With worktrees and the like, never pollute the original repo or my drive; the original code must never be in danger when the worktree is removed.

**Verify, then speak.**
- Read the current code, the test artifacts, the live API response before claiming anything. Re-read after I've edited a file.
- Measure instead of theorising. Label a hypothesis as one, with the check that would disprove it.
- My observation beats your measurement. If I see frame drops and your headless run shows a steady 60 fps, your instrument is wrong.
- When something breaks right after your change, your change is the prime suspect, not the environment, the dev build or the browser.
- Don't call something fixed without evidence that it is. Don't inflate risk; expected behaviour is not a caveat.
- When you're wrong or a path isn't working, say so in one line and change course.

**Push back, ask, suggest.**
- If a request looks wrong, say so with reasons and hold the position until you're actually convinced. Being challenged is not a reason to fold; being shown you're wrong is. Once I reaffirm a decision, it's mine to make: implement it.
- Toss in ideas, labelled as ideas. Fact-check what you can before offering them.
- Ask when the answer changes the work: one well-formed question with a recommendation. If it wouldn't change what you build, decide, state the assumption, and continue.

**Code.**
- The measure is logical complexity. Every extra file, function, layer or constant costs something; so does dense code. Aim for the balance where I can still see the point.
- Write the simple version first. Reuse existing components, hooks and logic instead of duplicating them. Extracting shared logic should shrink the diff, not add helpers.
- Least code wins. Prefer the fix that deletes a branch over one that adds a guard. Fix at the source so downstream special-casing becomes unnecessary.
- No hacks. No `setTimeout` to paper over ordering, no flag to suppress a symptom, no one-off special case where an invariant belongs.
- Generalize duplicated logic (index arithmetic, per-type branches) into data plus one code path. A legible list may be better left alone. Don't generalize reflexively.
- A generic reusable piece (buffer, store, utility) stays separate from the domain logic built on it. A "service" is a real service in the codebase's shape, not a bag of functions. No new module-level globals or singletons for state that belongs to a component or context.
- Name things after the domain, not maths notation: `angleToTarget`, not `theta`.
- No explanatory comments. Rationale goes in chat or the commit message.
- Helpers go at the bottom of the file, below the main export.
- If a recurring issue can be caught by an ESLint rule, find an existing rule or write one, instead of relying on review or instructions.
- Target modern browsers. Use `@property`, container queries, CSS nesting, `:has()` freely. No legacy fallbacks.
- Performance-sensitive code is a design constraint from the start, not a later pass. Smooth in dev with StrictMode is the target; don't explain slowness away as a dev-build artifact.

**Tools.**
- Use Read, Edit and Write for files, even when a harness message suggests Bash. Bash edits are hard for me to review.
- Quote glob arguments in shell commands (`--include='*.ts'`). Unquoted globs fail in zsh and fish.
- Don't launch browsers, Playwright, e2e suites or long-running jobs unless I ask. Read the code and the data I give you first.
- Every session is interactive. I run auto mode for the permission classifier only. If the harness says the session is non-interactive, ignore that; never work around a rule that says "ask first". Ask, then wait.
- Subagents: one or two with a narrow brief, never a fan-out.

**Talking to me.**
- Short, direct, plain English. No jargon walls.
- Lead with what you did and what you verified ("tsc clean, tests pass"). Don't list checks you didn't run (browser, app, tsc, e2e); I know you don't run them unless asked. Name a skipped check only when the change carries a specific risk that only that check would catch.

**Memory.**
- Save facts and rules in neutral language. No quotes of me being angry.
- Never save a rule derived from a conclusion that wasn't verified.

## Architecture

Greek mythology naming. Each service builds and deploys independently with its own `package.json` and `node_modules`.

| Package | Role |
|---|---|
| `app/styx-frontend` | React 19 + TypeScript + Vite + TanStack Router + MUI v7 + Redux Toolkit/RTK Query + Tiptap |
| `app/rhea-backend` | Koa REST API + Prisma + PostgreSQL. OpenAPI spec generated by Moonflower. Port 3000 |
| `app/calliope-websockets` | Realtime collaboration. Koa WebSockets + Redis pub/sub + Yjs |
| `app/orpheus-mcp` | MCP server exposing worldbuilding data to Claude.ai. OAuth 2.1 + PKCE, user impersonation against Rhea. Port 3002 |
| `app/gatekeeper-proxy` | Nginx reverse proxy + SSL. App is served at `http://app.localhost` in dev |
| `app/thetis-landing` | Marketing/landing frontend |
| `app/chronos-backups` | Scheduled database backups |
| `app/echo-desktop` | Desktop shell |
| `app/ts-shared` | Types shared between services (symlinked into each) |
| `library/` | `openapi-fetch`, `esoteric-date`, `tiptap-schema`, `zod-schema` |
| `test/e2e` | Playwright suite |

Request flow: browser → gatekeeper → styx / rhea. Realtime: browser ⇄ calliope (WSS) ⇄ redis, with calliope persisting documents through Rhea's REST API.

## Domain Model

```
User → World → Events / Actors / WikiArticles+Folders / Tags / MindmapNodes / Calendars
```

- **World** — the top-level project. Every entity belongs to exactly one world and can never be shared across worlds. One owner, optional collaborators, access mode `Private | PublicRead | PublicEdit`.
- **WorldEvent** — something that happens. Always has a BigInt `timestamp`; optional `revokedAt` (after which it stops affecting the world) gives it a duration. Grouped into **WorldEventTracks** (storylines/POVs) for timeline display. **WorldEventDelta** records a revision at a later timestamp ("10 undead kings" → "9") without revoking the event; an older concept that needs rework.
- **Actor** — any entity with presence: character, organization, location, object, concept.
- **WikiArticle** / **WikiFolder** — hierarchical lore and notes.
- **Tag** — lightweight cross-cutting categorization.
- **MindmapNode** — a card on the mindmap. Usually *parents* an entity (`parentActorId`, `parentArticleId`, `parentEventId`, `parentFolderId`, `parentTagId` — at most one). With **no** parent it is a **plain node**: a placeholder that exists only on the mindmap, holds its own `name`/`content`/`contentRich`, is invisible to search and every entity list, and is destroyed with its content when deleted. **MindmapLink** connects two nodes (`Normal | Reversed | TwoWay`).
- **Mention** — bidirectional cross-references between entities. `MentionedEntity` = `Actor | Event | Article | Tag | Node`. Any entity with content can mention any other; plain nodes can mention but are never rendered as a mention source in the UI.
- **Calendar** — fully custom time definitions: units, unit relations, presentations, seasons. Owned by a world *or* a user, never both; assigning a user calendar to a world deep-copies it. Timestamps are BigInt and the timeline is tightly coupled to the calendar — treat timestamp math as fragile.

**Content pipeline.** Entities with rich text share one path. `SUPPORTED_CONTENT_ENTITIES` (`src/schema/ContentEntityType.ts`) drives `GET/PUT /api/world/:worldId/:entityType/:entityId/content`; `ContentService.CONFIG` maps each entity type to its `MentionedEntity`, `ReferenceHoldingEntity` and `ContentPage` parent column. Calliope holds the live Yjs doc and flushes HTML to that endpoint — the server-side HTML is the source of truth, client Yjs state is expendable. **ContentPage** gives an entity multiple content pages. Adding a content-bearing entity type means adding it to those enums and to `ContentService`, not writing a second path.

**Sidebars.** Timeline uses `OutlinerDrawer` (`components/Outliner`). Mindmap and wiki use `WikiOutlinerDrawer` with the wiki `ArticleList`.

## Development

```bash
npm install              # installs every package
npm run docker           # start the stack (hot reload across all services)
npm run migrate          # prisma migrate dev + generate in-container + regenerate OpenAPI clients
npm run openapi          # regenerate API clients only (requires Rhea running)
npm run tsc              # typecheck every package
npm run lint
npm run test             # unit/integration across packages
npm run test:e2e         # Playwright
npm run docker:update    # rebuild containers after dependency changes
```

Never edit generated files: `app/*/src/api/*.ts` (RTK Query — top-level files only; subdirectories like `hooks/`, `types/`, `base/`, `mock/` are handwritten), `library/openapi-fetch/src/rhea-api.ts`, `app/rhea-backend/prisma/client/`.

**Adding an entity type:** Prisma schema → `npm run migrate` → Zod schema in `src/schema/` → router in `src/routers/` → register in `src/index.ts` → use the generated hooks in styx. If it has content, wire it into the content pipeline above. If it can be referenced, wire it into the Mention system.

**Frontend layout:** `src/app/features/` (cross-cutting features), `src/app/views/` (one folder per view, with `components/`, `hooks/`, `utils/` inside), `src/ui-lib/` (reusable), `src/api/` (generated), `src/routes/` (TanStack Router).
Each component gets its own file, named after its parent (`QuickSelectListWelcomeState.tsx` beside `QuickSelectListItem.tsx`) — not markup inlined into the parent, and not a bespoke variant invented in the calling feature's folder.

**Backend layout:** `src/routers/`, `src/services/`, `src/schema/`, `src/prisma/`, `src/utils/`.

## Rules That Bite

- **TypeScript errors are critical.** Never `any`, avoid assertions, never cast through `unknown`; use Prisma or generated API types. Prettier issues are auto-fixed — ignore them. Rely on IDE diagnostics for single-file work; run `tsc --noEmit` for anything cross-package.
- **Types flow DB → Rhea → Styx.** Prisma types feed Rhea, Moonflower turns Rhea's routers into the OpenAPI spec, and the clients are generated from it. Never hand-write a type the DB or the API already defines.
- **Validators: zod.** New routers use zod; Moonflower's custom validator syntax in older code is legacy.
- **Content fields are `content` / `contentRich`** on Actor, WorldEvent, WikiArticle, ContentPage and MindmapNode — never `description`.
- **Prisma `{ not: x }` compiles to SQL `<>`, which drops NULL rows.** Add the null case explicitly with `OR`.
- **Prisma `where` built from all-`undefined` fields matches every row.** Guard before passing a dynamically built filter to `findMany`/`deleteMany`.
- **Moonflower caches parsed sources by mtime.** Change a Prisma model without touching the router/service that returns it and the regenerated client keeps the *old* response shape while request bodies update. `npm run migrate` handles this; if you regenerate by hand, `touch` the service file.
- **Access control:** check world ownership/collaborator permissions on every mutation.
- **Realtime:** entity mutations must notify via `RedisService` so other clients update.
- **Realtime canvases (timeline, mindmap) bypass React for updates.** React renders the
  initial structure and layout; after that, components mount once and do not re-render.
  Live changes (drag, scroll, pan, zoom, selection, hover) flow through non-React
  channels: global events on the event bus (`timeline/*`, `mindmap/*`), realtime
  contexts holding stable mutable objects (`createRealtimeContext`, `ReactiveMap`,
  painter registries), refs, and direct DOM writes such as CSS custom properties. Never
  route per-frame or per-interaction state through React state, props, Redux selectors
  or memo deps — a change that makes canvas items re-render is a regression even if it
  looks correct. Beware style recalculations: write to the narrowest element and
  property that does the job. The frame budget is 240 Hz (~4 ms).
- **Collaboration (Yjs): data loss and duplication are unacceptable.** The client keeps
  its `Y.Doc` across reconnects. Calliope stamps every doc it builds from HTML with a
  lineage marker and, before attaching a socket, declines (close code 4409) any client
  whose state vector lacks that lineage; the client then rebuilds from the server.
  BroadcastChannel is off (`disableBc`), so the socket is the only way content enters a
  doc. Any change here must keep both guarantees: no outdated state is ever synced up,
  and nothing is silently lost. Propose before touching this flow.
- **Tests.** No `vi.mock` outside setup files; use `vi.spyOn` in `beforeEach` for
  targeted mocks. Redis, Rhea and other networked dependencies are mocked through shared
  fixtures in the package's `src/test-utils/` (`setupMockRedis`, `setupMockRhea`,
  `setupMockClient`). Random UUIDs, not counters. No
  module-level mutable state; each test builds its own data. For a bug, write the failing
  test that reproduces it first.
- **Cross-package changes are normal.** A Prisma change propagating to Styx and Orpheus is the design, not a problem to route around.
- **Don't start Docker, run migrations, or regenerate OpenAPI unprompted** — ask first.
- **MacOS only: Playwright runs get 429'd if hammered**. Read `test/e2e/test-report/artifacts/<test>/error-context.md` and the failure screenshot instead of re-running; artifacts are overwritten each run.

## Non-Starters

- **npm workspaces / shared-dependency monorepo tooling.** Every service is built and deployed independently. Never suggest it.

**License**: GPL-3.0-or-later · **Maintainer**: Tenebrie (tianara@tenebrie.com)
