# TLE Parser Command-Line Interface

The TLE Parser includes a powerful command-line interface for parsing, validating, and converting TLE data without writing code.

## Table of Contents

- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Options](#options)
- [Output Formats](#output-formats)
- [Advanced Features](#advanced-features)
- [Examples](#examples)
- [Integration](#integration)

## Installation

### Global Installation

```bash
npm install -g tle-parser
```

After global installation, the `tle-parser` command will be available system-wide.

### Local Installation

```bash
npm install tle-parser
```

Run locally using npx:

```bash
npx tle-parser [options] <file>
```

## Basic Usage

```bash
tle-parser [options] <file|url>
tle-parser [options] < input.txt
cat input.txt | tle-parser [options]
```

### Quick Start

```bash
# Parse a TLE file
tle-parser satellites.tle

# Parse with pretty-printed JSON
tle-parser --format json --pretty satellites.tle

# Convert to CSV
tle-parser --format csv satellites.tle > output.csv

# Validate without parsing
tle-parser --validate-only satellites.tle
```

## Options

### Format Options

| Option | Description | Values |
|--------|-------------|--------|
| `-f, --format <type>` | Output format | `json`, `csv`, `xml`, `yaml`, `human`, `tle` |
| `-p, --pretty` | Pretty-print output | For json, xml, yaml |
| `-c, --colors` | Enable colored output | For human format |
| `-v, --verbosity <level>` | Verbosity level | `compact`, `normal`, `verbose` |

### Input/Output Options

| Option | Description |
|--------|-------------|
| `-o, --output <file>` | Write output to file instead of stdout |
| `--url` | Fetch TLE from URL instead of file |
| `--recursive` | Process all TLE files in directory recursively |

### Processing Options

| Option | Description |
|--------|-------------|
| `--validate-only` | Only validate TLE, don't parse |
| `--watch` | Watch file for changes and reprocess |
| `--filter <pattern>` | Filter satellites by name or number (regex) |
| `--diff <file>` | Compare with another TLE file and show differences |

### Content Options

| Option | Description |
|--------|-------------|
| `--no-warnings` | Exclude warnings from output |
| `--no-comments` | Exclude comments from output |

### Help Options

| Option | Description |
|--------|-------------|
| `-h, --help` | Show help message |
| `--version` | Show version number |

## Output Formats

### JSON (Default)

```bash
tle-parser satellites.tle
tle-parser --format json --pretty satellites.tle
```

Output:
```json
{
  "satelliteName": "ISS (ZARYA)",
  "satelliteNumber": "25544",
  "inclination": "51.6416",
  "eccentricity": "0006703"
}
```

### CSV

```bash
tle-parser --format csv satellites.tle
tle-parser --format csv --output satellites.csv input.tle
```

Output:
```csv
"satelliteName","satelliteNumber","classification","epochYear","epochDay"
"ISS (ZARYA)","25544","U","08","264.51782528"
```

### XML

```bash
tle-parser --format xml --pretty satellites.tle
```

Output:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<tles>
  <tle>
    <satelliteName>ISS (ZARYA)</satelliteName>
    <satelliteNumber>25544</satelliteNumber>
  </tle>
</tles>
```

### YAML

```bash
tle-parser --format yaml satellites.tle
```

Output:
```yaml
satelliteName: ISS (ZARYA)
satelliteNumber: "25544"
classification: U
```

### Human-Readable

```bash
tle-parser --format human --colors satellites.tle
```

Output (with colors in terminal):
```
══════════════════════════════════════════════════════════════════════
  ISS (ZARYA)
══════════════════════════════════════════════════════════════════════

Basic Information:
  Satellite Number: 25544
  Classification: U

Orbital Parameters:
  Inclination: 51.6416°
  Eccentricity: 0006703
```

### TLE Reconstruction

```bash
tle-parser --format tle satellites.tle
```

Output:
```
ISS (ZARYA)
1 25544U 98067A   08264.51782528 -.00002182  00000-0 -11606-4 0  2927
2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.72125391563537
```

## Advanced Features

### Validation Only

Validate TLE data without parsing:

```bash
tle-parser --validate-only satellites.tle
```

Output:
```
✓ TLE validation passed

Warnings (1):
  ⚠ TLE epoch is 150 days old. TLE data may be stale.
```

### File Watching

Watch a file for changes and automatically reprocess:

```bash
tle-parser --watch satellites.tle
```

Output:
```
Watching satellites.tle for changes... (Press Ctrl+C to stop)

[2024-01-15T10:30:00.000Z] File changed, reprocessing...
{
  "satelliteName": "ISS (ZARYA)",
  ...
}
```

### Filtering

Filter satellites by name or number using regex:

```bash
# Filter by name
tle-parser --filter "STARLINK" satellites.tle

# Filter by number
tle-parser --filter "^255" satellites.tle

# Case-insensitive regex
tle-parser --filter "iss|zarya" satellites.tle
```

### Diff Mode

Compare two TLE files and show differences:

```bash
tle-parser --diff old.tle new.tle
```

Output:
```
=== TLE Comparison ===

Removed (2):
  - SATELLITE-A (12345)
  - SATELLITE-B (12346)

Added (1):
  + NEW-SATELLITE (99999)

Modified (3):
  ~ ISS (ZARYA) (25544)
    Inclination: 51.6416 → 51.6420
    Mean Motion: 15.72125391 → 15.72125400
    Epoch: 08:264.51782528 → 08:265.51782528

Summary: 2 removed, 1 added, 3 modified
```

### Remote URL Fetching

Fetch TLE data directly from URLs:

```bash
# Fetch from CelesTrak
tle-parser --url https://celestrak.org/NORAD/elements/gp.php?GROUP=stations

# Save to file
tle-parser --url --format json --pretty --output stations.json \
  https://celestrak.org/NORAD/elements/gp.php?GROUP=stations
```

### Recursive Directory Processing

Process all TLE files in a directory:

```bash
tle-parser --recursive data/

# With specific format
tle-parser --recursive --format csv data/ > all-satellites.csv
```

Output:
```
Processing: data/iss.tle
Processing: data/starlink.tle
Processing: data/subdirectory/gps.tle
```

### Standard Input/Output

The CLI fully supports Unix pipes and redirection:

```bash
# Read from stdin
cat satellites.tle | tle-parser --format json

# Write to file
tle-parser satellites.tle > output.json

# Chain with other commands
curl -s https://celestrak.org/NORAD/elements/gp.php?GROUP=stations | \
  tle-parser --filter "ISS" --format human --colors

# Complex pipeline
cat *.tle | tle-parser --format csv | grep "STARLINK" > starlink.csv
```

## Examples

### Convert TLE to JSON

```bash
tle-parser --format json --pretty satellites.tle > satellites.json
```

### Extract Specific Satellites

```bash
tle-parser --filter "^255" satellites.tle --format json
```

### Validate Multiple Files

```bash
for file in data/*.tle; do
  echo "Validating $file..."
  tle-parser --validate-only "$file"
done
```

### Monitor TLE Updates

```bash
tle-parser --watch --format human --colors satellites.tle
```

### Compare Before/After

```bash
# Download current TLEs
curl -o current.tle https://celestrak.org/NORAD/elements/gp.php?GROUP=stations

# Later, download again
curl -o updated.tle https://celestrak.org/NORAD/elements/gp.php?GROUP=stations

# Compare
tle-parser --diff current.tle updated.tle
```

### Batch Processing

```bash
# Process all TLE files in directory
tle-parser --recursive --format csv data/ > all-satellites.csv

# Filter and save
tle-parser --filter "STARLINK" --format json --pretty starlink-all.tle > starlink.json
```

### Create CSV Report

```bash
tle-parser --format csv \
  --verbosity compact \
  --no-warnings \
  satellites.tle > report.csv
```

### Human-Readable Analysis

```bash
# Verbose output with colors
tle-parser --format human \
  --colors \
  --verbosity verbose \
  satellites.tle | less -R
```

## Integration

### Shell Scripts

```bash
#!/bin/bash

# Download and parse ISS TLE
tle-parser --url https://celestrak.org/NORAD/elements/gp.php?GROUP=stations \
  --filter "ISS" \
  --format json \
  --output iss.json

# Check for errors
if [ $? -eq 0 ]; then
  echo "ISS TLE updated successfully"
else
  echo "Error updating ISS TLE"
  exit 1
fi
```

### Cron Jobs

```bash
# Update TLEs every hour
0 * * * * /usr/local/bin/tle-parser --url https://example.com/tles.txt --output /var/data/tles.json

# Monitor and alert on validation failures
*/15 * * * * /usr/local/bin/tle-parser --validate-only /var/data/satellites.tle || echo "TLE validation failed" | mail -s "Alert" admin@example.com
```

### Git Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Validate all TLE files before commit
for file in $(git diff --cached --name-only | grep '.tle$'); do
  echo "Validating $file..."
  tle-parser --validate-only "$file"
  if [ $? -ne 0 ]; then
    echo "TLE validation failed for $file"
    exit 1
  fi
done
```

### Data Pipeline

```bash
# Download -> Filter -> Convert -> Upload
curl -s https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink | \
  tle-parser --filter "STARLINK-[0-9]+" --format csv | \
  aws s3 cp - s3://my-bucket/starlink.csv
```

### Makefile Integration

```makefile
.PHONY: update-tles validate-tles

update-tles:
	tle-parser --url https://celestrak.org/NORAD/elements/gp.php?GROUP=stations \
		--output data/stations.json

validate-tles:
	@for file in data/*.tle; do \
		tle-parser --validate-only $$file || exit 1; \
	done
	@echo "All TLE files validated successfully"
```

## Exit Codes

The CLI uses standard exit codes:

- `0` - Success
- `1` - Error (validation failed, file not found, etc.)

Use in shell scripts:

```bash
if tle-parser --validate-only satellites.tle; then
  echo "Valid TLE"
else
  echo "Invalid TLE"
  exit 1
fi
```

## Performance Tips

1. **Use compact mode** for large datasets:
   ```bash
   tle-parser --verbosity compact large-dataset.tle
   ```

2. **Disable warnings** for production:
   ```bash
   tle-parser --no-warnings --no-comments data.tle
   ```

3. **Process in parallel** for multiple files:
   ```bash
   ls data/*.tle | xargs -P 4 -I {} tle-parser {} -o {}.json
   ```

4. **Use streaming** for large files:
   ```bash
   cat huge-dataset.tle | tle-parser --format csv > output.csv
   ```

## Troubleshooting

### Command Not Found

```bash
# If installed globally but command not found
npm list -g tle-parser

# Use npx instead
npx tle-parser satellites.tle
```

### Permission Denied

```bash
# Make CLI executable (if needed)
chmod +x node_modules/.bin/tle-parser
```

### Memory Issues with Large Files

```bash
# Process in chunks
split -l 3000 large.tle chunk_
for chunk in chunk_*; do
  tle-parser "$chunk" >> output.json
done
```

## See Also

- [Output Formats Documentation](./OUTPUT_FORMATS.md) - Detailed format specifications
- [API Reference](./api/API_REFERENCE.md) - Programmatic usage
- [Usage Examples](./guides/USAGE_EXAMPLES.md) - More examples
