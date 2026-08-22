# Issue tracker: GitHub

Issues and PRDs for this repo live as GitHub issues. Use the `gh` CLI for all operations.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --comments`, filtering comments by `jq` and also fetching labels.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

Infer the repo from `git remote -v` -- `gh` does this automatically when run inside a clone.

## Native issue relationships

Use GitHub's native relationships whenever a specification is decomposed into implementation tickets. Markdown references in issue bodies are useful context, but they do not replace native relationships.

- **Create a sub-issue**: `gh issue create --parent <parent-number> --title "..." --body "..."`
- **Attach existing sub-issues**: `gh issue edit <parent-number> --add-sub-issue <child-number>[,<child-number>...]`
- **Record a blocker**: run `gh issue edit <blocked-number> --add-blocked-by <blocker-number>[,<blocker-number>...]` on the issue that cannot start yet.
- **Record the inverse relation**: `gh issue edit <blocker-number> --add-blocking <blocked-number>[,<blocked-number>...]` is equivalent when the blocking issue is the natural starting point.
- **Verify relationships**: `gh issue view <number> --json parent,subIssues,blockedBy,blocking`.

When publishing a ticket graph, every child ticket must be a native sub-issue of its specification and every dependency edge must be a native `blocked by`/`blocking` relationship. Keep `Parent` and `Blocked by` body sections when the ticket format calls for them so the issue remains readable outside GitHub's relationship UI.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

When set to `yes`, PRs run through the same labels and states as issues, using the `gh pr` equivalents:

- **Read a PR**: `gh pr view <number> --comments` and `gh pr diff <number>` for the diff.
- **List external PRs for triage**: `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments` then keep only `authorAssociation` of `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR`, or `NONE` (drop `OWNER`/`MEMBER`/`COLLABORATOR`).
- **Comment / label / close**: `gh pr comment`, `gh pr edit --add-label`/`--remove-label`, `gh pr close`.

GitHub shares one number space across issues and PRs, so a bare `#42` may be either -- resolve with `gh pr view 42` and fall back to `gh issue view 42`.

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`.
