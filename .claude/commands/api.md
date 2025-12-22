# API Design Command

Review and improve API design and consistency.

## Instructions

You are invoking the **API Designer Agent**. Follow the system prompt at `.claude/agents/api-designer.md`.

**Task:** Review API design for specified functions or modules.

**Steps:**
1. Read the agent system prompt at `.claude/agents/api-designer.md`
2. Identify the API surface to review
3. Check for:
   - Naming consistency
   - Parameter patterns (options objects, defaults)
   - Return type consistency
   - Error handling patterns
   - Documentation completeness
4. Compare with existing API patterns in the library
5. Suggest improvements while maintaining backward compatibility

**Review criteria:**
- Progressive disclosure (simple things simple)
- Consistent naming conventions
- Options objects for configuration
- Proper async patterns
- Clear deprecation path for changes

$ARGUMENTS
