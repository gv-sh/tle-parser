# Output Formats & Serialization

The TLE Parser supports multiple output formats for parsed TLE data, making it easy to integrate with various systems and workflows.

## Table of Contents

- [Supported Formats](#supported-formats)
- [Format Functions](#format-functions)
- [Output Options](#output-options)
- [Examples](#examples)
- [TLE Reconstruction](#tle-reconstruction)

## Supported Formats

The library supports the following output formats:

1. **JSON** - Standard JSON format (default)
2. **CSV** - Comma-separated values for spreadsheets
3. **XML** - Extensible Markup Language
4. **YAML** - Human-friendly data serialization
5. **Human** - Colored, human-readable format
6. **TLE** - Reconstruct original TLE format

## Format Functions

### Universal Format Function

The `formatTLE()` function is the main entry point for formatting TLE data:

```typescript
import { parseTLE, formatTLE } from 'tle-parser';

const tle = parseTLE(tleString);
const output = formatTLE(tle, { format: 'json', pretty: true });
```

### Format-Specific Functions

Each format has its own dedicated function:

```typescript
import {
  formatAsJSON,
  formatAsCSV,
  formatAsXML,
  formatAsYAML,
  formatAsHuman,
  reconstructTLE
} from 'tle-parser';
```

## Output Options

All format functions accept an options object:

```typescript
interface OutputOptions {
  format?: 'json' | 'csv' | 'xml' | 'yaml' | 'human' | 'tle';
  pretty?: boolean;              // Pretty-print (JSON, XML, YAML)
  includeWarnings?: boolean;     // Include validation warnings
  includeComments?: boolean;     // Include TLE comments
  verbosity?: 'compact' | 'normal' | 'verbose';  // Output detail level
  colors?: boolean;              // Enable colors (human format)
}
```

### CSV-Specific Options

```typescript
interface CSVOptions extends OutputOptions {
  includeHeader?: boolean;       // Include CSV header row
  delimiter?: string;            // CSV delimiter (default: ',')
  quote?: boolean;               // Quote CSV fields
}
```

## Examples

### JSON Format

```typescript
import { parseTLE, formatAsJSON } from 'tle-parser';

const tle = parseTLE(tleString);

// Basic JSON
const json = formatAsJSON(tle);

// Pretty-printed JSON
const prettyJson = formatAsJSON(tle, { pretty: true });

// Compact JSON (essential fields only)
const compact = formatAsJSON(tle, { verbosity: 'compact' });

// Multiple TLEs as JSON array
const tles = [tle1, tle2, tle3];
const jsonArray = formatAsJSON(tles, { pretty: true });
```

Example output:

```json
{
  "satelliteName": "ISS (ZARYA)",
  "satelliteNumber": "25544",
  "classification": "U",
  "internationalDesignator": "98067A",
  "epochYear": "08",
  "epochDay": "264.51782528",
  "inclination": "51.6416",
  "eccentricity": "0006703",
  "meanMotion": "15.72125391"
}
```

### CSV Format

```typescript
import { parseTLE, formatAsCSV } from 'tle-parser';

const tles = [tle1, tle2, tle3];

// Basic CSV with header
const csv = formatAsCSV(tles, { includeHeader: true });

// Custom delimiter
const tsv = formatAsCSV(tles, { delimiter: '\t' });

// Compact CSV (fewer fields)
const compactCsv = formatAsCSV(tles, {
  verbosity: 'compact',
  includeHeader: true
});
```

Example output:

```csv
"satelliteName","satelliteNumber","classification","internationalDesignator","epochYear","epochDay"
"ISS (ZARYA)","25544","U","98067A","08","264.51782528"
"STARLINK-1007","44713","U","19074A","21","156.50901544"
```

### XML Format

```typescript
import { formatAsXML } from 'tle-parser';

// Basic XML
const xml = formatAsXML(tle);

// Pretty-printed XML
const prettyXml = formatAsXML(tle, { pretty: true });

// Multiple TLEs
const xmlMultiple = formatAsXML([tle1, tle2], { pretty: true });
```

Example output:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<tles>
  <tle>
    <satelliteName>ISS (ZARYA)</satelliteName>
    <satelliteNumber>25544</satelliteNumber>
    <classification>U</classification>
    <epochYear>08</epochYear>
    <epochDay>264.51782528</epochDay>
    <inclination>51.6416</inclination>
    <eccentricity>0006703</eccentricity>
    <meanMotion>15.72125391</meanMotion>
  </tle>
</tles>
```

### YAML Format

```typescript
import { formatAsYAML } from 'tle-parser';

// Basic YAML
const yaml = formatAsYAML(tle);

// Multiple TLEs
const yamlMultiple = formatAsYAML([tle1, tle2]);

// Without warnings and comments
const clean = formatAsYAML(tle, {
  includeWarnings: false,
  includeComments: false
});
```

Example output:

```yaml
satelliteName: ISS (ZARYA)
satelliteNumber: "25544"
classification: U
internationalDesignator: 98067A
epochYear: "08"
epochDay: "264.51782528"
inclination: "51.6416"
eccentricity: "0006703"
meanMotion: "15.72125391"
```

### Human-Readable Format

```typescript
import { formatAsHuman } from 'tle-parser';

// Basic human-readable
const human = formatAsHuman(tle);

// With colors
const colored = formatAsHuman(tle, { colors: true });

// Verbose mode (more details)
const verbose = formatAsHuman(tle, {
  colors: true,
  verbosity: 'verbose'
});
```

Example output:

```
══════════════════════════════════════════════════════════════════════
  ISS (ZARYA)
══════════════════════════════════════════════════════════════════════

Basic Information:
  Satellite Number: 25544
  Classification: U
  International Designator: 98067A

Epoch Information:
  Epoch Year: 08
  Epoch Day: 264.51782528

Orbital Parameters:
  Inclination: 51.6416°
  Right Ascension: 247.4627°
  Eccentricity: 0006703
  Argument of Perigee: 130.5360°
  Mean Anomaly: 325.0288°
  Mean Motion: 15.72125391 rev/day

══════════════════════════════════════════════════════════════════════
```

## TLE Reconstruction

Reconstruct the original TLE format from a parsed object:

```typescript
import { parseTLE, reconstructTLE } from 'tle-parser';

const tle = parseTLE(tleString);

// Reconstruct with satellite name (3-line format)
const reconstructed = reconstructTLE(tle, { includeName: true });

// Reconstruct without name (2-line format)
const twoLine = reconstructTLE(tle, { includeName: false });
```

Example output:

```
ISS (ZARYA)
1 25544U 98067A   08264.51782528 -.00002182  00000-0 -11606-4 0  2927
2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.72125391563537
```

### Round-Trip Parsing

The reconstruction is accurate enough to support round-trip parsing:

```typescript
const original = parseTLE(tleString);
const reconstructed = reconstructTLE(original);
const reparsed = parseTLE(reconstructed);

// Essential data is preserved
console.log(original.satelliteNumber === reparsed.satelliteNumber); // true
console.log(original.inclination === reparsed.inclination); // true
```

## Verbosity Levels

All formats support three verbosity levels:

### Compact

Includes only essential orbital parameters:
- Satellite name and number
- Epoch (year and day)
- Inclination
- Eccentricity
- Mean motion

### Normal (Default)

Includes all commonly used fields without internal details like checksums.

### Verbose

Includes all fields including:
- Line numbers
- Checksums
- Element set numbers
- All derivative terms
- Ephemeris type

## Batch Operations

All format functions support both single TLEs and arrays:

```typescript
// Single TLE
const single = formatAsJSON(tle);

// Multiple TLEs
const multiple = formatAsJSON([tle1, tle2, tle3]);

// Works with all formats
const csvBatch = formatAsCSV([tle1, tle2], { includeHeader: true });
const xmlBatch = formatAsXML([tle1, tle2], { pretty: true });
const yamlBatch = formatAsYAML([tle1, tle2]);
```

## Integration Examples

### Save to File

```typescript
import { writeFileSync } from 'fs';
import { parseBatch, formatAsJSON } from 'tle-parser';

const tles = parseBatch(tleData);
const json = formatAsJSON(tles, { pretty: true });
writeFileSync('satellites.json', json);
```

### HTTP API Response

```typescript
import { parseTLE, formatTLE } from 'tle-parser';

app.get('/api/satellite/:id', (req, res) => {
  const tle = getTLEFromDatabase(req.params.id);
  const parsed = parseTLE(tle);

  const format = req.query.format || 'json';
  const output = formatTLE(parsed, { format });

  res.type(format === 'json' ? 'application/json' : 'text/plain');
  res.send(output);
});
```

### Database Storage

```typescript
import { parseTLE, formatAsJSON } from 'tle-parser';

// Store as JSON in database
const tle = parseTLE(tleString);
const json = formatAsJSON(tle);
await db.satellites.insert({ data: JSON.parse(json) });

// Or use CSV for bulk import
const tles = parseBatch(tleData);
const csv = formatAsCSV(tles, { includeHeader: true });
await bulkImportCSV(csv);
```

## Best Practices

1. **Choose the right format**: Use JSON for APIs, CSV for spreadsheets, YAML for configuration, human-readable for debugging

2. **Use verbosity levels**: Reduce payload size with compact mode when you only need essential data

3. **Disable unnecessary data**: Set `includeWarnings: false` and `includeComments: false` for production APIs

4. **Pretty-print for development**: Enable `pretty: true` during development for easier debugging

5. **Validate before reconstruction**: Always validate TLE data before reconstructing to ensure accuracy

6. **Batch operations**: Process multiple TLEs together for better performance

## Error Handling

All format functions are designed to be safe:

```typescript
try {
  const output = formatTLE(tle, { format: 'json' });
} catch (error) {
  console.error('Format error:', error.message);
}

// Unsupported formats throw errors
try {
  formatTLE(tle, { format: 'invalid' }); // Throws error
} catch (error) {
  console.error(error.message); // "Unsupported output format: invalid"
}
```

## See Also

- [CLI Documentation](./CLI.md) - Command-line usage
- [API Reference](./api/API_REFERENCE.md) - Complete API documentation
- [Usage Examples](./guides/USAGE_EXAMPLES.md) - More examples
