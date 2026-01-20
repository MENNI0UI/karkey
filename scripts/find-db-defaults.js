const fs = require("fs").promises
const path = require("path")

const ROOT = path.resolve(__dirname, "..")
const EXCLUDE_DIRS = new Set(["node_modules", ".git", ".next", "dist", "out"])
const TARGET = "karkey_dev"
const REPLACEMENT = "karkey"

// Patterns to find
const patterns = [
  { name: "literal", re: new RegExp(`\\b${TARGET}\\b`, "i") },
  { name: "env-fallback", re: /process\.env\.DB_NAME\s*\|\|\s*['"]karkey_dev['"]/i },
  { name: "env-key", re: /\bDB_NAME\s*=\s*karkey_dev\b/i },
]

async function walk(dir, results = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (EXCLUDE_DIRS.has(e.name)) continue
      await walk(full, results)
    } else {
      const ext = path.extname(e.name).toLowerCase()
      // only check likely text/source files + env examples
      const textExts = new Set([".js", ".ts", ".tsx", ".jsx", ".json", ".env", ".example", ".sh", ".ps1", ".bash", ".txt"])
      if (!textExts.has(ext) && e.name !== ".env.example" && e.name !== ".env.local") continue
      results.push(full)
    }
  }
  return results
}

function previewLine(line, q = 120) {
  const s = line.trim()
  return s.length > q ? s.slice(0, q) + "…" : s
}

async function scan() {
  console.log("Scanning project for occurrences of:", TARGET)
  const files = await walk(ROOT)
  const matches = []
  for (const f of files) {
    let content
    try {
      content = await fs.readFile(f, "utf8")
    } catch {
      continue
    }
    const lines = content.split(/\r?\n/)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      for (const p of patterns) {
        if (p.re.test(line)) {
          matches.push({ file: f, line: i + 1, text: line, pattern: p.name })
          break
        }
      }
    }
  }

  if (matches.length === 0) {
    console.log("No occurrences found.")
    return []
  }

  for (const m of matches) {
    console.log(`${m.file}:${m.line}: ${previewLine(m.text)}`)
  }
  console.log(`\nFound ${matches.length} occurrence(s).`)
  return matches
}

async function replaceInFiles(matches) {
  if (matches.length === 0) return
  console.log("\nApplying safe replacements...")

  // Build unique file list
  const files = Array.from(new Set(matches.map((m) => m.file)))
  for (const f of files) {
    let content = await fs.readFile(f, "utf8")
    const original = content

    // Replace env fallback patterns like: process.env.DB_NAME || "karkey_dev"
    content = content.replace(/(process\.env\.DB_NAME\s*\|\|\s*)['"]karkey_dev['"]/gi, `$1"${REPLACEMENT}"`)
    // Replace DB_NAME= in .env files
    content = content.replace(/\b(DB_NAME\s*=\s*)karkey_dev\b/gi, `$1${REPLACEMENT}`)
    // Replace bare literal occurrences conservatively (only whole word)
    content = content.replace(new RegExp(`\\b${TARGET}\\b`, "g"), REPLACEMENT)

    if (content !== original) {
      await fs.writeFile(f, content, "utf8")
      console.log(`Updated: ${f}`)
    }
  }

  // Ensure .env.local specifically (if exists) is updated
  const envLocal = path.join(ROOT, ".env.local")
  try {
    const stat = await fs.stat(envLocal)
    if (stat && stat.isFile()) {
      let envContent = await fs.readFile(envLocal, "utf8")
      const newEnvContent = envContent.replace(/\b(DB_NAME\s*=\s*)karkey_dev\b/i, `$1${REPLACEMENT}`)
      if (newEnvContent !== envContent) {
        await fs.writeFile(envLocal, newEnvContent, "utf8")
        console.log(`Updated .env.local DB_NAME -> ${REPLACEMENT}`)
      }
    }
  } catch {
    // ignore if no .env.local
  }
  console.log("Replacement pass finished.")
}

;(async () => {
  try {
    const matches = await scan()
    const doReplace = process.argv.includes("--replace") || process.argv.includes("-r")
    if (matches.length > 0 && doReplace) {
      // confirm in interactive shells only
      if (process.env.CI) {
        console.log("CI environment detected — applying replacements without prompt.")
        await replaceInFiles(matches)
      } else {
        const readline = require("readline")
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
        rl.question("Replace occurrences of 'karkey_dev' with 'karkey' in the listed files? (y/N) ", async (ans) => {
          rl.close()
          if (ans.trim().toLowerCase().startsWith("y")) {
            await replaceInFiles(matches)
          } else {
            console.log("Aborted by user. No files modified.")
          }
        })
      }
    } else if (matches.length > 0) {
      console.log("\nRun with --replace (or -r) to perform safe replacements.")
    }
  } catch (err) {
    console.error("Error scanning project:", err)
    process.exitCode = 1
  }
})())
