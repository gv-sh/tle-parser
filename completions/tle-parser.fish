# Fish completion script for tle-parser

# Format options
complete -c tle-parser -s f -l format -d 'Output format' -xa 'json csv xml yaml human tle'

# Boolean options
complete -c tle-parser -s p -l pretty -d 'Pretty-print output'
complete -c tle-parser -s c -l colors -d 'Enable colored output'

# Verbosity options
complete -c tle-parser -s v -l verbosity -d 'Verbosity level' -xa 'compact normal verbose'

# File output
complete -c tle-parser -s o -l output -d 'Output file' -r

# Validation
complete -c tle-parser -l validate-only -d 'Only validate TLE'

# Watch mode
complete -c tle-parser -l watch -d 'Watch file for changes'

# Filter
complete -c tle-parser -l filter -d 'Filter satellites by pattern' -r

# Diff
complete -c tle-parser -l diff -d 'Compare with another TLE file' -r -F

# URL
complete -c tle-parser -l url -d 'Fetch TLE from URL'

# Recursive
complete -c tle-parser -l recursive -d 'Process all TLE files in directory'

# REPL mode
complete -c tle-parser -l repl -d 'Start interactive REPL mode'

# Progress
complete -c tle-parser -l progress -d 'Show progress indicators for large files'

# Warnings and comments
complete -c tle-parser -l no-warnings -d 'Exclude warnings from output'
complete -c tle-parser -l no-comments -d 'Exclude comments from output'

# Help and version
complete -c tle-parser -s h -l help -d 'Show help message'
complete -c tle-parser -l version -d 'Show version number'

# Complete with .tle and .txt files
complete -c tle-parser -x -a '(__fish_complete_suffix .tle)'
complete -c tle-parser -x -a '(__fish_complete_suffix .txt)'
