// Scan project files and add `legacyBehavior` to <Link ...> tags that have a direct <a ...> child.
// Usage: node c:\Users\abdel\Desktop\karkey\scripts\fix-link-legacy.js
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const exts = [".tsx", ".jsx", ".ts", ".js"];
const files = [];

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (name === "node_modules" || name === ".git") continue;
      walk(full);
    } else if (exts.includes(path.extname(name))) {
      files.push(full);
    }
  }
}
walk(root);

const linkWithAnchorRegex = /<Link([\s\S]*?)>\s*(?:\r?\n\s*)*<a(\s|>)/g;

let changed = 0;
for (const f of files) {
  let src = fs.readFileSync(f, "utf8");
  let m;
  let updated = src;
  // Replace any <Link ...> that does NOT already include legacyBehavior
  updated = updated.replace(linkWithAnchorRegex, (match, p1, p2) => {
    if (/\blegacyBehavior\b/.test(p1)) return match; // already fixed
    // preserve existing attributes, add legacyBehavior (self-closing style)
    return `<Link${p1} legacyBehavior>\n  <a${p2}`;
  });
  if (updated !== src) {
    fs.writeFileSync(f, updated, "utf8");
    console.log("Patched:", path.relative(root, f));
    changed++;
  }
}

console.log(`Done. Files modified: ${changed}`);
if (changed > 0) {
  console.log("Please restart your dev server and run a hard refresh (Ctrl+F5).");
} else {
  console.log("No matches found. If error persists, search project for '<Link' with nested '<a'.");
}
