#!/usr/bin/env node
/**
 * Scaffold a new blog post.
 *
 * Usage:
 *   npm run new-post -- "My post title"
 *   npm run new-post -- "My post title" --tags react,node
 *
 * Creates src/data/blog/YYYY-MM-DD-slug.md with frontmatter pre-filled.
 */
import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = join(__dirname, "..", "src", "data", "blog");

const args = process.argv.slice(2);
const titleIdx = args.findIndex(a => !a.startsWith("--"));
if (titleIdx === -1) {
  console.error("Usage: npm run new-post -- \"My post title\" [--tags a,b,c]");
  process.exit(1);
}
const title = args[titleIdx];
const tagsArg = args.find(a => a.startsWith("--tags="))?.slice(7)
  ?? (args[args.indexOf("--tags") + 1] ?? "others");
const tags = tagsArg
  .split(",")
  .map(t => t.trim())
  .filter(Boolean);

const slugify = s =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const now = new Date();
const pad = n => String(n).padStart(2, "0");
const datePart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
const slug = slugify(title);
const fileName = `${datePart}-${slug}.md`;
const filePath = join(BLOG_DIR, fileName);

if (existsSync(filePath)) {
  console.error(`File already exists: ${filePath}`);
  process.exit(1);
}
if (!existsSync(BLOG_DIR)) mkdirSync(BLOG_DIR, { recursive: true });

const iso = now.toISOString();
const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
description: "TODO: one-sentence summary that shows up in previews and the index."
pubDatetime: ${iso}
tags:
${tags.map(t => `  - ${t}`).join("\n")}
draft: true
---

Write your post here. A few quick reminders:

- Code fences with language hints (\`\`\`ts, \`\`\`java, …) pick up Shiki syntax highlighting.
- Drop images under \`src/assets/images/\` and reference them with Markdown image syntax.
- Math is rendered via KaTeX — use \`$inline$\` or \`$$block$$\`.
- When you're ready to publish, flip \`draft: true\` to \`false\`.
`;

writeFileSync(filePath, frontmatter);
console.log(`Created ${filePath}`);
