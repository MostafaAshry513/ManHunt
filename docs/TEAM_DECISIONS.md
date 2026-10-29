# Team decisions

Newest first. Architecture decisions live in `docs/DECISIONS.md`.

## TD-1 - Disjoint directory ownership instead of worktrees

OpenCode supports worktrees, but this repository is small and agents would otherwise
duplicate Gradle/npm caches and require merge review for every change. Agents get exclusive
directories (`server/**`, `.github/**`+`scripts/**`, one docs file); the lead owns
`android/**`. Conflict risk is eliminated without merge overhead.

## TD-2 - Agent models

- `deepseek/deepseek-v4-pro` for the adversarial security review (reasoning-heavy,
  read-only output).
- `deepseek/deepseek-flash` for bounded implementation work (backend features, CI scripts).
- Lead (V4.1 Flash) implements Android UI and integrates.

## TD-3 - Contracts frozen during the parallel batch

Changing REST/WS shapes mid-batch would invalidate both sides at once. The lead updates
`docs/ARCHITECTURE.md` first, then notifies agents in a new task.

## TD-4 - Verification is the lead's job

Agent reports are treated as claims. The lead re-runs tests and inspects diffs before
commit. Security-sensitive changes (auth, location ACL, tags) get an independent read.
