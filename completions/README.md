# Shell Completion Scripts for tle-parser

This directory contains shell completion scripts for tle-parser, providing tab-completion for commands, options, and file paths.

## Installation

### Bash

Add the following to your `~/.bashrc` or `~/.bash_profile`:

```bash
source /path/to/tle-parser/completions/tle-parser.bash
```

Or install system-wide:

```bash
sudo cp completions/tle-parser.bash /etc/bash_completion.d/tle-parser
```

Then reload your shell:

```bash
source ~/.bashrc
```

### Zsh

Add the completion script to your fpath by adding this to your `~/.zshrc`:

```zsh
fpath=(/path/to/tle-parser/completions $fpath)
autoload -Uz compinit && compinit
```

Or copy to a location already in your fpath:

```bash
cp completions/_tle-parser ~/.zsh/completion/_tle-parser
```

Then reload your shell:

```zsh
source ~/.zshrc
```

### Fish

Copy the completion script to Fish's completions directory:

```bash
cp completions/tle-parser.fish ~/.config/fish/completions/
```

Fish will automatically load the completions on next shell start.

## Features

All completion scripts provide:

- Option name completion (e.g., `--format`, `--pretty`, `--repl`)
- Format value completion for `--format` option (json, csv, xml, yaml, human, tle)
- Verbosity level completion for `--verbosity` option (compact, normal, verbose)
- File path completion for `.tle` and `.txt` files
- Short and long option variants (e.g., `-f` and `--format`)

## Usage Examples

After installation, try typing:

```bash
tle-parser --<TAB>          # Lists all available options
tle-parser --format <TAB>   # Lists available output formats
tle-parser <TAB>            # Lists .tle and .txt files in current directory
```

## Testing

To test if completions are working:

1. Type `tle-parser --` and press TAB
2. You should see a list of available options
3. Type `tle-parser --format ` and press TAB
4. You should see format options (json, csv, xml, yaml, human, tle)
