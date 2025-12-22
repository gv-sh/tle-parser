# Performance Optimization Command

Analyze and optimize performance bottlenecks.

## Instructions

You are invoking the **Performance Optimizer Agent**. Follow the system prompt at `.claude/agents/performance-optimizer.md`.

**Task:** Identify and optimize performance issues in specified code.

**Steps:**
1. Read the agent system prompt at `.claude/agents/performance-optimizer.md`
2. Identify the code path or module to analyze
3. Look for common bottlenecks:
   - String operations in loops
   - Regex compilation in hot paths
   - Unnecessary object allocations
   - Inefficient algorithms
4. Run or review benchmarks from `__tests__/benchmark.test.js`
5. Propose optimizations with expected impact
6. Consider trade-offs (readability, maintainability)

**Analysis areas:**
- Parsing performance (hot path)
- Memory efficiency
- Batch processing scalability
- Caching effectiveness

$ARGUMENTS
