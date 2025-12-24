# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of Schemock seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please email security reports to: [toxzak.svg@gmail.com](mailto:toxzak.svg@gmail.com)

Include the following information:
- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### What to Expect

- You should receive an acknowledgment within 48 hours
- We will send a more detailed response within 7 days indicating the next steps
- We will keep you informed about the progress toward fixing the vulnerability
- We may ask for additional information or guidance

## Security Best Practices

When using Schemock:

### Input Validation
- Always validate and sanitize user inputs before using them in schemas
- Use the built-in validation utilities (`validateFilePath`, `validateSchema`, etc.)
- Be cautious with file paths - avoid user-provided absolute paths

### Schema Security
- Review JSON schemas for potential security issues before using them
- Avoid schemas that could generate excessive data
- Set reasonable limits on array sizes (`maxItems`)
- Be careful with circular references

### Server Configuration
- Run Schemock servers in isolated environments when possible
- Use firewalls to restrict access to development servers
- Don't expose mock servers publicly unless necessary
- Use CORS settings appropriately for your use case

### Dependencies
- Keep Schemock and its dependencies up to date
- Regularly run `npm audit` to check for vulnerabilities
- Review security advisories for dependencies

## Known Security Considerations

### 1. pkg Vulnerability (Moderate - GHSA-22r3-9w55-cj54)
**Status:** Acknowledged  
**Impact:** Low - Development dependency only  
**Details:** The `pkg` package has a local privilege escalation vulnerability. This only affects the build process for standalone executables and does not impact the library when used as a dependency.  
**Mitigation:** This vulnerability does not affect runtime usage of Schemock. Users importing Schemock as a library are not affected. For building executables, ensure you're in a trusted build environment.

### 2. JSON Schema Complexity
**Risk:** Denial of Service  
**Details:** Complex or deeply nested schemas could cause high CPU/memory usage  
**Mitigation:**
- Set reasonable limits on schema depth
- Use `maxItems` and `maxLength` constraints
- Monitor resource usage in production
- Implement timeouts for schema parsing

### 3. File System Access
**Risk:** Path Traversal  
**Details:** Schema files are read from the file system  
**Mitigation:**
- Built-in path validation prevents directory traversal (`../`)
- File paths are sanitized and validated
- Only JSON files are processed
- Always validate file paths before use

### 4. Mock Data Generation
**Risk:** Information Disclosure  
**Details:** Generated mock data should never contain real sensitive information  
**Mitigation:**
- Schemock generates random data based on schemas
- No real data is ever used or stored
- Review generated responses to ensure no sensitive data leakage
- Use environment-specific schemas

## Security Testing

We perform the following security testing:

### Automated Testing
- ✅ npm audit (dependency scanning)
- ✅ Input validation tests
- ✅ Path traversal prevention tests
- ✅ Error handling tests
- ✅ Schema validation tests

### Manual Testing
- Code reviews for security issues
- OWASP Top 10 checks
- Input fuzzing
- Penetration testing (basic)

### CI/CD Security
- Dependency updates monitored
- Automated security scans on pull requests
- Version pinning for critical dependencies

## Disclosure Policy

- We follow responsible disclosure practices
- Security fixes are prioritized and released ASAP
- We will credit security researchers (unless they prefer anonymity)
- Security advisories are published on GitHub Security Advisories

## Security Updates

Security updates are released as:
- **Critical:** Immediate patch release (1.0.x)
- **High:** Patch release within 7 days
- **Medium:** Patch release within 30 days
- **Low:** Included in next minor/major release

Subscribe to releases on GitHub to get notified of security updates.

## Compliance

Schemock follows:
- OWASP Top 10 guidelines
- Node.js security best practices
- Semantic Versioning for security patches
- Responsible disclosure guidelines

## Contact

For security concerns, contact:
- Email: toxzak.svg@gmail.com
- GitHub Security Advisory: https://github.com/toxzak-svg/schemock-app/security/advisories

---

Last Updated: 2025-12-23
