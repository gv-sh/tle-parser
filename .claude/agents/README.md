# TLE Parser - Claude Sub-Agents

This directory contains specialized Claude sub-agent prompts for developing and polishing the TLE Parser library.

## Available Agents

| Agent | Purpose | Slash Command |
|-------|---------|---------------|
| **Code Reviewer** | Code quality, readability, consistency | `/review` |
| **Test Engineer** | Test design, coverage, property testing | `/test` |
| **Documentation** | API docs, guides, examples | `/docs` |
| **TypeScript Expert** | Type safety, patterns, best practices | `/typescript` |
| **Performance Optimizer** | Bottlenecks, optimization, benchmarks | `/perf` |
| **API Designer** | API consistency, naming, evolution | `/api` |
| **Security Auditor** | Vulnerabilities, input validation | `/security` |

## Orchestration Commands

| Command | Purpose |
|---------|---------|
| `/polish` | Full library quality check using all agents |
| `/pr-review` | Comprehensive PR review |

## Agent Files

```
.claude/
├── agents/                    # Agent system prompts
│   ├── code-reviewer.md       # Code review expertise
│   ├── test-engineer.md       # Testing expertise
│   ├── documentation.md       # Documentation expertise
│   ├── typescript-expert.md   # TypeScript expertise
│   ├── performance-optimizer.md # Performance expertise
│   ├── api-designer.md        # API design expertise
│   ├── security-auditor.md    # Security expertise
│   └── README.md              # This file
│
└── commands/                  # Slash commands
    ├── review.md              # /review command
    ├── test.md                # /test command
    ├── docs.md                # /docs command
    ├── typescript.md          # /typescript command
    ├── perf.md                # /perf command
    ├── api.md                 # /api command
    ├── security.md            # /security command
    ├── polish.md              # /polish command
    └── pr-review.md           # /pr-review command
```

## Usage Examples

### Review Recent Changes
```
/review
```
Reviews files changed in the last commit.

### Review Specific Files
```
/review src/validation.ts src/index.ts
```

### Write Tests for a Module
```
/test src/cache.ts
```

### Full Library Polish
```
/polish
```

### PR Review
```
/pr-review
```

## Agent Capabilities

### Code Reviewer
- TypeScript quality checks
- Consistency with codebase patterns
- Error handling review
- Naming conventions
- Performance considerations

### Test Engineer
- Unit test design
- Integration test scenarios
- Property-based testing with fast-check
- Coverage gap identification
- Regression test creation

### Documentation
- API reference documentation
- Usage guides and tutorials
- Code examples
- Terminology consistency
- Markdown formatting

### TypeScript Expert
- Type safety analysis
- Branded types usage
- Discriminated unions
- Type guards
- Generic constraints
- Declaration file quality

### Performance Optimizer
- Hot path analysis
- String operation optimization
- Memory efficiency
- Regex optimization
- Caching strategies
- Benchmark creation

### API Designer
- Naming consistency
- Parameter patterns
- Return type consistency
- Backward compatibility
- Deprecation strategies
- Progressive disclosure

### Security Auditor
- Input validation
- Prototype pollution
- ReDoS prevention
- Injection attacks
- Path traversal
- Information disclosure

## Contributing

When adding new agents:
1. Create agent prompt in `.claude/agents/[name].md`
2. Create slash command in `.claude/commands/[name].md`
3. Update this README
4. Test the agent with various scenarios
