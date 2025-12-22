# Polish Command - Full Library Quality Check

Run a comprehensive quality check using multiple specialized agents.

## Instructions

This command orchestrates multiple agents to perform a thorough quality review of the library.

**Task:** Perform a comprehensive polish of specified files or the entire library.

**Steps:**

### Phase 1: Code Quality Analysis
1. **Code Review**: Check for code quality issues, consistency, and best practices
2. **TypeScript Review**: Verify type safety and TypeScript patterns
3. **API Review**: Check API design consistency

### Phase 2: Security & Performance
4. **Security Audit**: Scan for vulnerabilities
5. **Performance Review**: Identify optimization opportunities

### Phase 3: Documentation & Testing
6. **Documentation Check**: Verify docs are complete and accurate
7. **Test Coverage**: Identify gaps in test coverage

**Execution:**
For each phase, read the corresponding agent prompt from `.claude/agents/` and apply its analysis to the target files.

**Output Format:**
```markdown
# Library Polish Report

## Summary
- Files analyzed: [count]
- Critical issues: [count]
- Suggestions: [count]

## Code Quality
[Code reviewer findings]

## TypeScript
[TypeScript expert findings]

## API Design
[API designer findings]

## Security
[Security auditor findings]

## Performance
[Performance optimizer findings]

## Documentation
[Documentation agent findings]

## Test Coverage
[Test engineer findings]

## Prioritized Action Items
1. [Critical] ...
2. [High] ...
3. [Medium] ...
```

$ARGUMENTS
