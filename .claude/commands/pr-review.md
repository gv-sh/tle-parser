# Pull Request Review Command

Perform a comprehensive review of changes for a pull request.

## Instructions

This command reviews all changes in a PR or branch using multiple specialized agents.

**Task:** Review all changes for PR readiness.

**Steps:**

### 1. Gather Changes
```bash
# Get changed files
git diff main --name-only

# Get full diff
git diff main
```

### 2. Apply Specialized Reviews

For each category of change, apply the relevant agent:

- **Source code changes** (`src/**/*.ts`):
  - Code Reviewer Agent
  - TypeScript Expert Agent
  - Security Auditor Agent

- **Test changes** (`__tests__/**/*`):
  - Test Engineer Agent

- **Documentation changes** (`docs/**/*.md`, `README.md`):
  - Documentation Agent

- **API changes** (exported functions in `src/index.ts`):
  - API Designer Agent

### 3. Generate PR Review

**Output Format:**
```markdown
# PR Review: [Branch Name]

## Changes Summary
- Files changed: [count]
- Lines added: [count]
- Lines removed: [count]

## Review Status: [APPROVE / REQUEST_CHANGES / NEEDS_DISCUSSION]

## Code Review
[Findings from code reviewer]

## Type Safety
[Findings from TypeScript expert]

## Security
[Findings from security auditor]

## API Changes
[Findings from API designer - only if API surface changed]

## Test Coverage
[Are new features tested? Test quality?]

## Documentation
[Are changes documented? Changelog needed?]

## Blocking Issues
- [ ] [Issue 1]
- [ ] [Issue 2]

## Suggestions (non-blocking)
- [ ] [Suggestion 1]

## Checklist
- [ ] Tests pass
- [ ] Types correct
- [ ] No security issues
- [ ] Documentation updated
- [ ] CHANGELOG updated (if needed)
```

$ARGUMENTS
