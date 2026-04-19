# myBlog

Source for [myblog.jszsoft.com](https://myblog.jszsoft.com/) — built with [Astro](https://astro.build) on top of the [AstroPaper](https://github.com/satnaing/astro-paper) theme.

## Quick start

```bash
npm install
npm run dev        # local dev server at http://localhost:4321
npm run build      # static build to ./dist
npm run preview    # preview the production build
```

## Writing a new post

Scaffold a new post file with the helper script — just give it a title:

```bash
npm run new-post -- "How I built my own static-site generator"
npm run new-post -- "Dijkstra for the busy" --tags algorithm,notes
```

This creates `src/data/blog/YYYY-MM-DD-slug.md` with the frontmatter pre-filled. Open the file, write, and `git push` when you're ready — the draft flag controls visibility:

```yaml
---
title: "My new post"
description: "One-sentence summary."
pubDatetime: 2026-04-19T12:00:00Z
tags:
  - tag1
  - tag2
draft: true   # flip to false when ready to publish
---
```

### Frontmatter fields

| Field | Required | Notes |
|---|---|---|
| `title` | yes | Shown in the list + on the post page |
| `description` | yes | Used for SEO + post card preview |
| `pubDatetime` | yes | ISO date. Controls sort order |
| `tags` | optional | Lowercase, kebab-case. Defaults to `["others"]` |
| `draft` | optional | `true` hides the post from listings |
| `featured` | optional | `true` surfaces the post in the Featured section |
| `ogImage` | optional | Custom social-share image |
| `modDatetime` | optional | ISO date for "last updated" |

### Where things live

| Content | Path |
|---|---|
| Blog posts | `src/data/blog/*.md` |
| Post images | `public/assets/images/posts/<id>/...` → reference as `/assets/images/posts/<id>/file.png` |
| Site metadata (title, author, socials) | `src/config.ts` + `src/constants.ts` |
| Colors / theme | `src/styles/global.css` |
| About page | `src/pages/about.md` |
| Home-page hero | `src/pages/index.astro` |

### Math

Wrap math in `$inline$` or `$$block$$` — rendered with KaTeX.

## Deployment

Any push to `main` triggers `.github/workflows/deploy.yml`, which builds the site and publishes it to GitHub Pages. The custom domain `myblog.jszsoft.com` is configured via `public/CNAME`.

> Make sure GitHub Pages is set to **"GitHub Actions"** as the source (Repo → Settings → Pages → Build and deployment → Source).
