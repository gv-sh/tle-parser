#!/usr/bin/env bash
# Bash completion script for tle-parser

_tle_parser_completions() {
    local cur prev opts
    COMPREPLY=()
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"

    # All available options
    opts="--format --pretty --colors --verbosity --output --validate-only --watch --filter --diff --url --recursive --repl --progress --no-warnings --no-comments --help --version -f -p -c -v -o -h"

    # Options that take arguments
    case "${prev}" in
        -f|--format)
            local formats="json csv xml yaml human tle"
            COMPREPLY=( $(compgen -W "${formats}" -- ${cur}) )
            return 0
            ;;
        -v|--verbosity)
            local levels="compact normal verbose"
            COMPREPLY=( $(compgen -W "${levels}" -- ${cur}) )
            return 0
            ;;
        -o|--output|--diff)
            # File completion
            COMPREPLY=( $(compgen -f -- ${cur}) )
            return 0
            ;;
        --filter)
            # No completion for filter patterns
            return 0
            ;;
    esac

    # Complete with options or files
    if [[ ${cur} == -* ]] ; then
        COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
        return 0
    else
        # Complete with .tle and .txt files
        COMPREPLY=( $(compgen -f -X '!*.@(tle|txt)' -- ${cur}) $(compgen -d -- ${cur}) )
        return 0
    fi
}

complete -F _tle_parser_completions tle-parser
