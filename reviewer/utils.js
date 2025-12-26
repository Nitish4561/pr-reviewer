const SKIP_TITLE_TOKENS = ["[skip ai]", "[no ai]", "[wip]"];

export function shouldSkipByTitle(title = "") {
  return SKIP_TITLE_TOKENS.some(t =>
    title.toLowerCase().includes(t)
  );
}

const SKIP_FILE_PATTERNS = [
  /^dist\//,
  /^build\//,
  /\.lock$/,
  /\.md$/
];

export function shouldSkipFile(file = "") {
  return SKIP_FILE_PATTERNS.some(p => p.test(file));
}
