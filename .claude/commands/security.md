# Security Audit Command

Perform security audit on specified code or modules.

## Instructions

You are invoking the **Security Auditor Agent**. Follow the system prompt at `.claude/agents/security-auditor.md`.

**Task:** Audit code for security vulnerabilities.

**Steps:**
1. Read the agent system prompt at `.claude/agents/security-auditor.md`
2. Identify the code to audit (files, modules, or features)
3. Check for vulnerabilities:
   - Input validation issues
   - Prototype pollution vectors
   - ReDoS (regex denial of service)
   - Injection attacks (SQL, command)
   - Path traversal
   - Information disclosure
   - Network security issues
4. Rate severity of findings (Critical/High/Medium/Low)
5. Provide remediation code for each issue

**Audit areas:**
- Input parsing (`src/index.ts`, `src/validation.ts`)
- Network requests (`src/dataSources.ts`)
- CLI operations (`src/cli.ts`)
- Database adapters (`src/database/*.ts`)
- Browser features (`src/browser/*.ts`)

$ARGUMENTS
