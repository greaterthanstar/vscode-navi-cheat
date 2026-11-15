# Navi Cheat Sheet Syntax for VS Code

Syntax highlighting and language support for the [navi](https://github.com/denisidoro/navi) console cheatsheet tool's `.cheat` files.

<img width="1902" height="822" alt="image" src="https://github.com/user-attachments/assets/b4fa0b27-5b07-4d80-ae0d-931576890b33" />


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
