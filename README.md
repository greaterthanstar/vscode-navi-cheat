# Navi Cheat Sheet Syntax for VS Code

Syntax highlighting and language support for [navi](https://github.com/denisidoro/navi) `.cheat` files.

## Features

- **Tag headers (`%`)**: Highlights tag directives and comma-separated tag names.
- **Tag dependencies (`@`)**: Highlights inherited tag imports.
- **Snippet descriptions (`#`)**: Distinctly styles command descriptions and inline `<placeholder>` references.
- **Variable generators (`$`)**: Highlights variable definitions, shell commands, and `---` fzf options (`--column`, `--headers`, `--delimiter`, `--map`, etc.).
- **Placeholders (`<var>`)**: Highlights `<variable>` placeholders across commands, descriptions, and quoted strings.
- **Comments (`;`)**: Supports `;` line comments and toggling via `Ctrl+/` (`Cmd+/` on macOS).
- **Command tokens**: Highlights command names, CLI flags (`-f`, `--flag`), environment variables (`$VAR`), strings, and shell operators (`|`, `&&`, `||`, `;`).

## License

MIT
