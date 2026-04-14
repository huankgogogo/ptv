export interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

/**
 * Strip markdown code fences from a string.
 * Handles ```tsx, ```ts, ```jsx, ```js and plain ``` fences.
 */
export function stripMarkdownFences(code: string): string {
  let result = code;
  result = result.replace(/^```(?:tsx?|jsx?)?\n?/, "");
  result = result.replace(/\n?```\s*$/, "");
  return result.trim();
}

/**
 * Lightweight validation to check if GPT response contains JSX content.
 * This is a fallback check after the LLM pre-validation.
 */
export function validateGptResponse(response: string): ValidationResult {
  const trimmed = response.trim();

  // Check for JSX-like content (at least one opening tag)
  // Matches: <ComponentName, <div, <span, etc.
  const hasJsx = /<[A-Z][a-zA-Z]*|<[a-z]+[^>]*>/.test(trimmed);
  if (!hasJsx) {
    return {
      isValid: false,
      error:
        "The response was not a valid motion graphics component. Please try a different prompt.",
    };
  }

  return {
    isValid: true,
    error: null,
  };
}

/**
 * Remove natural language prose that the LLM sometimes writes at the top of
 * the component body before any real code (e.g. "I need to create a blue
 * animation..."). Works by scanning lines after the component declaration and
 * dropping any line that looks like a natural-language sentence rather than JS.
 *
 * Only strips lines that appear BEFORE the first recognisable JS token so
 * that valid code inside the body is never touched.
 */
export function removeLeadingNaturalLanguage(code: string): string {
  const componentPattern =
    /export\s+const\s+\w+\s*=\s*\(\s*\)\s*=>\s*\{/;
  const match = code.match(componentPattern);
  if (!match || match.index === undefined) return code;

  const splitAt = match.index + match[0].length;
  const before = code.slice(0, splitAt);
  const body = code.slice(splitAt);

  // A line is valid JS if it starts with one of these tokens (after whitespace)
  const JS_START =
    /^\s*(?:\/\/|\/\*|\*|const|let|var|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|new|typeof|await|async|export|import|\{|\}|<\/?\s*[A-Za-z]|\/[^/]|`|"|'|\(|\[|[0-9]|\+|-|!|~|\$)/;

  const lines = body.split("\n");
  const result: string[] = [];
  let foundCode = false;

  for (const line of lines) {
    if (foundCode) {
      result.push(line);
      continue;
    }
    const trimmed = line.trim();
    if (trimmed === "") {
      result.push(line);
      continue;
    }
    if (JS_START.test(line)) {
      foundCode = true;
      result.push(line);
    }
    // else: skip — this is a natural language line before any code
  }

  return before + result.join("\n");
}


/**
 * Extract only the component code, removing any trailing text/commentary.
 * Uses brace counting to find the end of the component.
 */
export function extractComponentCode(code: string): string {
  // Find the component declaration start
  const exportMatch = code.match(
    /export\s+const\s+\w+\s*=\s*\(\s*\)\s*=>\s*\{/,
  );

  if (exportMatch && exportMatch.index !== undefined) {
    const declarationStart = exportMatch.index;
    const bodyStart = declarationStart + exportMatch[0].length;

    // Count braces to find the matching closing brace
    let braceCount = 1;
    let endIndex = bodyStart;

    for (let i = bodyStart; i < code.length; i++) {
      const char = code[i];
      if (char === "{") {
        braceCount++;
      } else if (char === "}") {
        braceCount--;
        if (braceCount === 0) {
          endIndex = i;
          break;
        }
      }
    }

    if (braceCount === 0) {
      // Return everything from start of code to end of component (including closing brace and semicolon)
      let result = code.slice(0, endIndex + 1);
      // Add semicolon if not present
      if (!result.trim().endsWith(";")) {
        result = result.trimEnd() + ";";
      }
      return result.trim();
    }
  }

  // Fallback: return as-is
  return code;
}
