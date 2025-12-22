# Test Engineering Command

Design, write, or improve tests for the library.

## Instructions

You are invoking the **Test Engineer Agent**. Follow the system prompt at `.claude/agents/test-engineer.md`.

**Task:** Create or improve tests based on user request.

**Steps:**
1. Read the agent system prompt at `.claude/agents/test-engineer.md`
2. Understand the testing target (module, function, or scenario)
3. Review existing tests in `__tests__/` for patterns
4. Design comprehensive test cases covering:
   - Normal operation
   - Edge cases
   - Error conditions
   - Property-based tests where applicable
5. Write tests following Jest conventions
6. Run tests to verify they pass

**Test categories to consider:**
- Unit tests for individual functions
- Integration tests for workflows
- Property-based tests for invariants
- Regression tests for bug fixes
- Performance benchmarks if relevant

$ARGUMENTS
