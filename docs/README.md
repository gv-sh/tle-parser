# TLE Parser Documentation

Comprehensive documentation for the TLE Parser library.

## Quick Start

- **New to TLEs?** Start with the [FAQ](FAQ.md)
- **Ready to code?** Check [Usage Examples](guides/USAGE_EXAMPLES.md)
- **API Reference** Full function docs at [API Reference](api/API_REFERENCE.md)

---

## Documentation Structure

### Core Documentation

| Document | Description |
|----------|-------------|
| [API Reference](api/API_REFERENCE.md) | Complete API documentation with all functions, types, and examples |
| [Usage Examples](guides/USAGE_EXAMPLES.md) | Practical examples for common scenarios |
| [FAQ](FAQ.md) | Frequently asked questions and answers |

### Understanding TLEs

| Document | Description |
|----------|-------------|
| [TLE Format Guide](guides/TLE_FORMAT.md) | Detailed explanation of TLE structure and all fields |
| [TLE Structure Diagrams](guides/TLE_STRUCTURE.md) | Visual reference with diagrams and breakdowns |
| [Orbital Mechanics](guides/ORBITAL_MECHANICS.md) | Understanding the physics behind TLE parameters |

### Working with the Parser

| Document | Description |
|----------|-------------|
| [Error Handling](guides/ERROR_HANDLING.md) | Comprehensive error handling patterns and strategies |
| [Troubleshooting](guides/TROUBLESHOOTING.md) | Solutions to common problems and issues |
| [Performance Guide](guides/PERFORMANCE.md) | Optimization strategies for large-scale processing |

---

## By Topic

### Getting Started

1. [What is a TLE?](FAQ.md#what-is-a-tle) - Introduction to Two-Line Element Sets
2. [Where to get TLE data](FAQ.md#where-can-i-get-tle-data) - Data sources
3. [Basic parsing example](guides/USAGE_EXAMPLES.md#basic-usage) - Your first parse
4. [TypeScript usage](api/API_REFERENCE.md#typescript-usage) - Type-safe development

### Understanding TLE Data

1. [TLE Format Overview](guides/TLE_FORMAT.md#tle-structure-overview) - Complete format specification
2. [Field descriptions](guides/TLE_FORMAT.md#field-specifications) - What each field means
3. [Visual diagrams](guides/TLE_STRUCTURE.md) - See the structure visually
4. [Orbital elements explained](guides/ORBITAL_MECHANICS.md#classical-orbital-elements) - Physics concepts

### Common Tasks

- [Parse a single TLE](guides/USAGE_EXAMPLES.md#parse-a-simple-tle)
- [Parse multiple TLEs from a file](guides/USAGE_EXAMPLES.md#multiple-tles-from-a-file)
- [Handle different input formats](guides/USAGE_EXAMPLES.md#input-formats)
- [Validate TLE data](guides/USAGE_EXAMPLES.md#validation-scenarios)
- [Calculate orbital period](FAQ.md#how-do-i-calculate-the-orbital-period)
- [Determine orbit type](guides/ORBITAL_MECHANICS.md#orbit-types)

### Error Handling

- [Basic error handling](guides/ERROR_HANDLING.md#handling-patterns)
- [Understanding error codes](guides/ERROR_HANDLING.md#error-codes-reference)
- [Permissive vs strict mode](FAQ.md#whats-the-difference-between-strict-and-permissive-mode)
- [Error recovery](guides/ERROR_HANDLING.md#error-recovery)

### Integration

- [Express.js API](guides/USAGE_EXAMPLES.md#expressjs-api-endpoint)
- [React component](guides/USAGE_EXAMPLES.md#react-component)
- [Command line tool](guides/USAGE_EXAMPLES.md#command-line-tool)
- [Browser usage](FAQ.md#can-i-use-this-in-the-browser)

### Performance

- [Benchmarks](guides/PERFORMANCE.md#benchmarks)
- [Batch processing](guides/PERFORMANCE.md#batch-processing-pattern)
- [Streaming large files](guides/PERFORMANCE.md#streaming-processing)
- [Caching strategies](guides/PERFORMANCE.md#caching-strategies)
- [Memory optimization](guides/PERFORMANCE.md#memory-optimization)

### Troubleshooting

- [Common errors](guides/TROUBLESHOOTING.md#parsing-errors)
- [Checksum errors](guides/TROUBLESHOOTING.md#checksum-validation-failed)
- [Data quality issues](guides/TROUBLESHOOTING.md#data-quality-issues)
- [Integration problems](guides/TROUBLESHOOTING.md#integration-issues)

---

## Complete Document List

### API Documentation

- **[API Reference](api/API_REFERENCE.md)** - Main functions
  - parseTLE()
  - validateTLE()
  - parseWithStateMachine()
  - Validation functions
  - Utility functions
  - Types and interfaces
  - Error codes

### Guides

- **[Usage Examples](guides/USAGE_EXAMPLES.md)**
  - Basic usage
  - Input formats
  - Options and configuration
  - Real-world applications
  - Integration examples
  - Advanced use cases

- **[TLE Format Guide](guides/TLE_FORMAT.md)**
  - Format overview
  - Line 1 fields
  - Line 2 fields
  - Field specifications
  - Checksum algorithm
  - Scientific notation
  - Common pitfalls

- **[TLE Structure Diagrams](guides/TLE_STRUCTURE.md)**
  - Visual breakdowns
  - Character-by-character maps
  - Field diagrams
  - Quick reference tables

- **[Error Handling Guide](guides/ERROR_HANDLING.md)**
  - Error types
  - Error codes reference
  - Warning codes
  - Handling patterns
  - Parsing modes
  - Error recovery
  - Best practices

- **[Troubleshooting Guide](guides/TROUBLESHOOTING.md)**
  - Installation issues
  - Parsing errors
  - Data quality issues
  - Performance problems
  - Integration issues
  - Common mistakes
  - Debugging tips

- **[Orbital Mechanics Concepts](guides/ORBITAL_MECHANICS.md)**
  - Classical orbital elements
  - TLE-specific parameters
  - Orbit types
  - Perturbations
  - Practical applications
  - Further reading

- **[Performance Guide](guides/PERFORMANCE.md)**
  - Performance characteristics
  - Benchmarks
  - Optimization strategies
  - Large-scale processing
  - Memory optimization
  - Caching strategies

### Reference

- **[FAQ](FAQ.md)**
  - General questions
  - Parser questions
  - Data interpretation
  - Technical questions
  - Historical and special cases
  - Troubleshooting
  - Learning resources

---

## Contributing to Documentation

Found an error or want to improve the docs?

1. **Report issues**: Open an issue on GitHub
2. **Suggest improvements**: Submit a pull request
3. **Ask questions**: Start a discussion

### Documentation Standards

- **Clear examples**: Every concept should have code examples
- **Visual aids**: Use diagrams where helpful
- **Cross-references**: Link to related documentation
- **Search-friendly**: Use descriptive headings and keywords

---

## External Resources

### TLE Data Sources

- **CelesTrak**: https://celestrak.org/
- **Space-Track**: https://www.space-track.org/
- **N2YO**: https://www.n2yo.com/

### Learning Resources

- **NASA Space Flight**: https://spaceflight.nasa.gov/
- **CelesTrak Columns**: https://celestrak.org/columns/
- **AGI Resources**: https://www.agi.com/resources

### Related Libraries

- **satellite.js**: Orbit propagation (JavaScript)
- **python-sgp4**: Orbit propagation (Python)
- **Orekit**: Advanced orbit mechanics (Java)

---

## License

This documentation is part of the TLE Parser library and is released under the MIT License.

---

## Changelog

- **2025-01-15**: Initial comprehensive documentation release
  - API Reference
  - Usage Examples
  - TLE Format Guide
  - Error Handling Guide
  - Troubleshooting Guide
  - Orbital Mechanics Guide
  - TLE Structure Diagrams
  - FAQ
  - Performance Guide
