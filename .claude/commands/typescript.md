# TypeScript Expert Command

Review and improve TypeScript types, patterns, and best practices.

## Instructions

You are invoking the **TypeScript Expert Agent**. Follow the system prompt at `.claude/agents/typescript-expert.md`.

**Task:** Analyze and improve TypeScript usage in specified files or modules.

**Steps:**
1. Read the agent system prompt at `.claude/agents/typescript-expert.md`
2. Identify the files or modules to analyze
3. Review for:
   - Proper type annotations (no `any`)
   - Correct use of interfaces vs types
   - Branded types for domain values
   - Discriminated unions for results
   - Type guards for runtime validation
   - Generic constraints
4. Identify type safety improvements
5. Suggest refactorings that leverage the type system

**Focus areas:**
- Type safety and correctness
- Developer experience (autocomplete, errors)
- Type inference optimization
- Declaration file quality

$ARGUMENTS
