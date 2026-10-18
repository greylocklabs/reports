/**
 * Keeps reports from notifying anyone or anything: a zero-width space defuses @mentions, #123 and owner/repo#123
 * issue references, GH-123, and links to GitHub, which would otherwise put a cross-reference on that issue.
 */
export function defuse(s: string): string {
  return s
    .replace(/@/g, "@\u200b")
    .replace(/#(?=\d)/g, "#\u200b")
    .replace(/\bGH-(?=\d)/gi, (m) => `${m.slice(0, 2)}\u200b-`)
    .replace(/github\.com/gi, (m) => `${m.slice(0, 6)}\u200b${m.slice(6)}`);
}

/** Also keeps text from closing the code span it sits in. */
export function inline(s: string): string {
  return defuse(s.replace(/[`\r\n]/g, " "));
}

export function plain(s: string): string {
  return defuse(s.replace(/\r/g, ""));
}

/** Text for a fenced code block, which nothing can close early; mentions and references do not link inside one. */
export function fenced(s: string): string {
  return s.replace(/\r/g, "").replace(/```/g, "``\u200b`");
}
