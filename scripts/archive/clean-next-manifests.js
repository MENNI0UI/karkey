const fs = require("fs").promises
const path = require("path")

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) files.push(...await walk(full))
    else files.push(full)
  }
  return files
}

async function main() {
  const root = path.resolve(__dirname, "..")
  const nextDir = path.join(root, ".next")
  try {
    const stat = await fs.stat(nextDir).catch(() => null)
    if (!stat || !stat.isDirectory()) {
      console.log(".next not found, nothing to clean.")
      return
    }
    const all = await walk(nextDir)
    const jsonFiles = all.filter(f => f.endsWith(".json"))
    let removed = 0
    for (const jf of jsonFiles) {
      try {
        const txt = await fs.readFile(jf, "utf8")
        JSON.parse(txt)
      } catch (err) {
        console.warn("Removing invalid JSON file:", jf)
        await fs.unlink(jf).catch(() => null)
        removed++
      }
    }
    console.log(`Done. checked ${jsonFiles.length} json files, removed ${removed} corrupted files.`)
  } catch (e) {
    console.error("clean-next-manifests failed:", e)
    process.exitCode = 2
  }
}

main()
