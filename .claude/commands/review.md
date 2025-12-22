# Code Review Command

Review code for quality, TypeScript best practices, and consistency.

## Instructions

You are invoking the **Code Reviewer Agent**. Follow the system prompt at `.claude/agents/code-reviewer.md`.

**Task:** Review the code specified by the user (files, recent changes, or specific modules).

**Steps:**
1. Read the agent system prompt at `.claude/agents/code-reviewer.md`
2. Identify the files or changes to review (from user request or recent git changes)
3. Read and analyze the relevant code
4. Apply the review checklist from the agent prompt
5. Provide a structured review with:
   - Critical issues (blocking)
   - Suggestions (improvements)
   - Positive observations
   - Specific line comments

**Default behavior:** If no specific files are mentioned, review files changed in the last commit:
```bash
git diff HEAD~1 --name-only
```

$ARGUMENTS
