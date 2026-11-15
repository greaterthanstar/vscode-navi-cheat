const vscode = require("vscode");

const SYMBOL_DOCS = {
  "%": {
    title: "`%` — Tag / Section Header",
    body: [
      "Starts a new cheatsheet section with comma-separated tags.",
      "",
      "- **Syntax:** `% tag1, tag2, tag3`",
      "- **Variable Scope:** Any `$ variable:` definitions below this line are scoped to this `%` block (unless imported elsewhere via `@`)."
    ]
  },
  "@": {
    title: "`@` — Tag Dependency (Import)",
    body: [
      "Inherits variables (`$`) defined under another `%` tag section.",
      "",
      "- **Syntax:** `@ parent_tag1, parent_tag2`",
      "- Place directly below a `%` header line."
    ]
  },
  "#": {
    title: "`#` — Snippet Description",
    body: [
      "Describes the command immediately following it.",
      "",
      "- **Note:** In `navi`, `#` is **not** a comment — it is the searchable label displayed in the interactive finder (`fzf`).",
      "- Use `;` for actual comments ignored by `navi`."
    ]
  },
  "$": {
    title: "`$` — Variable Suggestion Generator",
    body: [
      "Defines a shell command whose stdout populates interactive suggestions for `<variable>` placeholders.",
      "",
      "- **Syntax:** `$ var_name: <shell_command> --- <fzf_options>`",
      "- **Optional `---` flags:**",
      "  - `--column <n>`: Extract only column `<n>` from selected row",
      "  - `--delimiter <regex>`: Custom column delimiter",
      "  - `--headers <n>`: Ignore first `<n>` header lines",
      "  - `--map <cmd>`: Transform the selected value via `<cmd>`",
      "  - `--multi`: Allow selecting multiple values",
      "  - `--expand`: Prefix each selected value with the flag",
      "  - `--prevent-extra`: Disallow typing custom values not in list"
    ]
  },
  ";": {
    title: "`;` — Comment",
    body: [
      "A true comment line completely ignored by `navi`.",
      "",
      "- Toggle comments on any line with `Ctrl+/` (`Cmd+/` on macOS)."
    ]
  }
};

const NAVI_FLAG_DOCS = {
  "---": "Separates the `$ variable:` generator shell command from `navi` / `fzf` selection options.",
  "--column": "`--column <n>` — Extracts the `<n>`th column (1-indexed) from the selected suggestion line.",
  "--headers": "`--headers <n>` — Treats the first `<n>` lines of output as non-selectable headers in `fzf`.",
  "--delimiter": "`--delimiter <regex>` — Sets the column delimiter regex used with `--column`.",
  "--map": "`--map <shell_cmd>` — Pipes the selected value through `<shell_cmd>` before substituting it.",
  "--multi": "`--multi` — Allows selecting multiple items in `fzf` (`Tab` / `Shift+Tab`).",
  "--expand": "`--expand` — Repeats the surrounding argument for each selected item.",
  "--prevent-extra": "`--prevent-extra` — Forces selection from the generated list (disallows custom free-text input).",
  "--fzf-overrides": "`--fzf-overrides '<opts>'` — Passes raw options directly to `fzf`."
};

/**
 * Finds the `$ var:` definition for a given variable name inside the active `%` section
 * (or globally in the file as fallback).
 */
function findVariableGenerator(document, position, varName) {
  let sectionStart = 0;
  let sectionEnd = document.lineCount - 1;

  for (let i = position.line; i >= 0; i--) {
    const text = document.lineAt(i).text;
    if (/^%/.test(text)) {
      sectionStart = i;
      break;
    }
  }
  for (let i = position.line + 1; i < document.lineCount; i++) {
    const text = document.lineAt(i).text;
    if (/^%/.test(text)) {
      sectionEnd = i - 1;
      break;
    }
  }

  const varRegex = new RegExp(`^\\$\\s*${varName}\\s*:\\s*(.+)$`);

  for (let i = sectionStart; i <= sectionEnd; i++) {
    const match = document.lineAt(i).text.match(varRegex);
    if (match) {
      return { command: match[1].trim(), line: i + 1, scoped: true };
    }
  }

  for (let i = 0; i < document.lineCount; i++) {
    const match = document.lineAt(i).text.match(varRegex);
    if (match) {
      return { command: match[1].trim(), line: i + 1, scoped: false };
    }
  }

  return null;
}

function activate(context) {
  const provider = vscode.languages.registerHoverProvider("navi-cheat", {
    provideHover(document, position) {
      const line = document.lineAt(position.line).text;
      if (!line.trim()) {
        return null;
      }

      // 1. Check if hovering over `<placeholder>` anywhere on the line
      const placeholderRegex = /<([a-zA-Z0-9_-]+)>/g;
      let match;
      while ((match = placeholderRegex.exec(line)) !== null) {
        const startCol = match.index;
        const endCol = startCol + match[0].length;
        if (position.character >= startCol && position.character <= endCol) {
          const varName = match[1];
          const gen = findVariableGenerator(document, position, varName);
          const md = new vscode.MarkdownString();
          md.appendMarkdown(`**\`<${varName}>\` — Navi Placeholder Variable**\n\n`);
          if (gen) {
            md.appendMarkdown(`Populated by generator on line ${gen.line}:\n`);
            md.appendCodeblock(`$ ${varName}: ${gen.command}`, "powershell");
            if (!gen.scoped) {
              md.appendMarkdown(
                `*(Note: Defined in a different \`%\` section; add \`@ <tag>\` to inherit it if needed.)*`
              );
            }
          } else {
            md.appendMarkdown(
              `No \`$ ${varName}:\` generator found in this file — \`navi\` will prompt you to type a value interactively.`
            );
          }
          return new vscode.Hover(
            md,
            new vscode.Range(position.line, startCol, position.line, endCol)
          );
        }
      }

      // 2. Check if hovering over `---` or `--flag` on a `$ var:` line
      if (/^\$/.test(line)) {
        for (const [flag, desc] of Object.entries(NAVI_FLAG_DOCS)) {
          const idx = line.indexOf(flag);
          if (
            idx !== -1 &&
            position.character >= idx &&
            position.character <= idx + flag.length
          ) {
            const md = new vscode.MarkdownString(
              `**Navi Generator Option**\n\n${desc}`
            );
            return new vscode.Hover(
              md,
              new vscode.Range(position.line, idx, position.line, idx + flag.length)
            );
          }
        }
      }

      // 3. Check if hovering over the leading line prefix symbol (%, @, #, $, ;)
      //    or over the `$ var_name:` identifier
      const prefixChar = line[0];
      if (SYMBOL_DOCS[prefixChar]) {
        let hoverEndCol = 1;
        if (prefixChar === "$") {
          const varHeaderMatch = line.match(/^\$\s*[a-zA-Z0-9_]+\s*:/);
          if (varHeaderMatch) {
            hoverEndCol = varHeaderMatch[0].length;
          }
        } else if (prefixChar === "%" || prefixChar === "@") {
          hoverEndCol = line.length;
        }

        if (position.character <= hoverEndCol) {
          const info = SYMBOL_DOCS[prefixChar];
          const md = new vscode.MarkdownString(
            `**${info.title}**\n\n${info.body.join("\n")}`
          );
          return new vscode.Hover(
            md,
            new vscode.Range(position.line, 0, position.line, hoverEndCol)
          );
        }
      }

      return null;
    }
  });

  context.subscriptions.push(provider);
}

function deactivate() {}

module.exports = { activate, deactivate };
