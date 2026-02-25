#!/usr/bin/env node
/**
 * Interactive release script (gitflow)
 * Run from project root: npm run release
 *
 * Flow: develop → release/vX.Y.Z → PR to main
 * After merge: tag vX.Y.Z, merge to develop, delete release branch
 */

import { createInterface } from "readline";
import { execSync, spawnSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function ask(question, defaultVal = "") {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const def = defaultVal ? ` (${defaultVal})` : "";
  return new Promise((resolve) => {
    rl.question(`${question}${def}: `, (answer) => {
      rl.close();
      resolve((answer || defaultVal).trim());
    });
  });
}

function run(cmd, options = {}) {
  return execSync(cmd, { cwd: ROOT, encoding: "utf-8", ...options });
}

function runOrFail(cmd, msg = "Command failed") {
  const r = spawnSync(cmd, { cwd: ROOT, shell: true, stdio: "inherit" });
  if (r.status !== 0) {
    console.error(`\n${msg}`);
    process.exit(1);
  }
}

function parseVersion(v) {
  const m = v.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function bumpVersion(current, type) {
  const p = parseVersion(current);
  if (!p) return null;
  const [major, minor, patch] = p;
  switch (type) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    default:
      return null;
  }
}

async function main() {
  console.log("\n  Release (gitflow)\n  =================\n");

  // 1. Ensure we're on develop and clean
  const branch = run("git rev-parse --abbrev-ref HEAD").trim();
  if (branch !== "develop") {
    console.error(`  Expected branch 'develop', got '${branch}'`);
    console.error("  Switch with: git checkout develop\n");
    process.exit(1);
  }

  const status = run("git status --porcelain");
  if (status) {
    console.error("  Working tree is not clean. Commit or stash changes first.\n");
    process.exit(1);
  }

  run("git fetch origin 2>/dev/null || true");

  // 2. Read current version
  const pkgPath = join(ROOT, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  const currentVersion = pkg.version || "0.0.1";

  console.log(`  Current version: ${currentVersion}\n`);
  console.log("  Bump type:");
  console.log("    1) patch  - bug fixes (0.0.1 → 0.0.2)");
  console.log("    2) minor  - new features (0.0.1 → 0.1.0)");
  console.log("    3) major  - breaking changes (0.0.1 → 1.0.0)");
  console.log("    4) custom - enter version (e.g. 1.2.3)\n");

  const choice = await ask("Choose 1-4", "1");
  let newVersion;
  switch (choice) {
    case "1":
      newVersion = bumpVersion(currentVersion, "patch");
      break;
    case "2":
      newVersion = bumpVersion(currentVersion, "minor");
      break;
    case "3":
      newVersion = bumpVersion(currentVersion, "major");
      break;
    case "4":
      newVersion = await ask("Enter version (e.g. 1.2.3)");
      if (!parseVersion(newVersion)) {
        console.error("  Invalid version format. Use X.Y.Z");
        process.exit(1);
      }
      break;
    default:
      newVersion = bumpVersion(currentVersion, "patch");
  }

  const branchName = `release/v${newVersion}`;
  console.log(`\n  Creating release branch: ${branchName}`);
  console.log(`  Version: ${currentVersion} → ${newVersion}\n`);

  const confirm = await ask("Proceed? (y/n)", "y");
  if (confirm.toLowerCase() !== "y" && confirm.toLowerCase() !== "yes") {
    console.log("  Cancelled.\n");
    process.exit(0);
  }

  // 3. Create release branch
  runOrFail(`git checkout -b ${branchName}`, "Failed to create release branch");

  // 4. Bump version in package.json
  pkg.version = newVersion;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");

  // 5. Commit
  runOrFail(
    `git add package.json && git commit -m "chore(release): v${newVersion}"`,
    "Failed to commit version bump"
  );

  // 6. Output next steps
  console.log("\n  ✓ Release branch created and version bumped.\n");
  console.log("  Next steps:\n");
  console.log(`    1. Push branch:    git push -u origin ${branchName}`);
  console.log(`    2. Open PR:        ${branchName} → main`);
  console.log("    3. Get review, merge PR to main");
  console.log("    4. After merge to main:");
  console.log(`       git checkout main && git pull`);
  console.log(`       git tag v${newVersion}`);
  console.log(`       git push origin v${newVersion}`);
  console.log(`       git checkout develop && git pull`);
  console.log(`       git merge main`);
  console.log(`       git push origin develop`);
  console.log(`       git branch -d ${branchName}`);
  if (run("git rev-parse origin/develop 2>/dev/null").trim()) {
    console.log(`       git push origin --delete ${branchName}  # if pushed`);
  }
  console.log("\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
