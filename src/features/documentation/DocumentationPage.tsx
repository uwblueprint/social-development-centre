import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { Marked, type Tokens } from "marked";
import {
  DocumentationTabs,
  type DocumentationGuide,
  type TocEntry,
} from "./DocumentationTabs";

/**
 * Renders `docs/user-guide/<portal>-*.md` in the portal as HTML, one tab per guide, with an
 * "On this page" contents list built from each guide's h2/h3 headings. The Markdown is ours
 * (checked into the repo), so rendering it as HTML is safe.
 */
const GUIDE_DIR = path.join(process.cwd(), "docs", "user-guide");

/**
 * Tab labels, in tab order: the orientation guide first, then the portal's sidebar order
 * (AdminShell / PartnerShell). Unlisted guides fall back to their file name, after these.
 */
const TAB_LABEL: Record<string, string> = {
  "admin-getting-around": "Getting around",
  "admin-opportunities": "Opportunities",
  "admin-insights": "Insights",
  "admin-community": "Community",
  "admin-partners": "Partners",
  "partner-getting-started": "Getting started",
  "partner-opportunities": "Opportunities",
};
const ORDER = Object.keys(TAB_LABEL);

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/<[^>]+>|[*`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function renderGuide(
  md: string,
  guideId: string,
  portal: string,
): { html: string; toc: TocEntry[] } {
  const toc: TocEntry[] = [];
  const used = new Set<string>();
  const marked = new Marked({ gfm: true });
  marked.use({
    renderer: {
      heading({ tokens, depth, text }: Tokens.Heading) {
        const inner = this.parser.parseInline(tokens);
        // The file's h1 is the tab label, so it isn't repeated in the page.
        if (depth === 1) return "";
        // Ids are prefixed by guide: every tab is in the DOM at once.
        let id = `${guideId}-${slug(text)}`;
        while (used.has(id)) id += "-2";
        used.add(id);
        if (depth <= 3)
          toc.push({
            id,
            label: text.replace(/[*`]/g, ""),
            level: depth as 2 | 3,
          });
        const level = Math.min(depth, 4);
        return `<h${level} id="${id}">${inner}</h${level}>\n`;
      },
      link({ href, tokens }: Tokens.Link) {
        const inner = this.parser.parseInline(tokens);
        // Links between guides open that guide's tab.
        const guide = /^\.?\/?(admin|partner)-([a-z-]+)\.md(#.*)?$/.exec(href);
        if (guide && guide[1] === portal)
          return `<a href="?guide=${guide[2]}">${inner}</a>`;
        const external = /^https?:/.test(href);
        return `<a href="${href}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${inner}</a>`;
      },
      image({ href, text }: Tokens.Image) {
        // Guide screenshots live in docs/user-guide/img; the page serves them from /documentation-assets.
        const src = href.startsWith("img/") ? `/documentation-assets/${href.slice(4)}` : href;
        return `<img src="${src}" alt="${text.replace(/"/g, "&quot;")}" loading="lazy" />`;
      },
      html({ text }: Tokens.HTML | Tokens.Tag) {
        // Screenshots written as <figure><img src="img/…"> get the same /documentation-assets address as markdown images.
        return text.replace(/(<img\s[^>]*?src=")img\//g, "$1/documentation-assets/");
      },
      table(token: Tokens.Table) {
        // Wide tables scroll inside their own frame instead of widening the page.
        return `<div class="doc-table" role="region" aria-label="Table" tabindex="0">${marked.Renderer.prototype.table.call(this, token)}</div>`;
      },
    },
  });
  const html = marked.parse(md, { async: false });
  return { html, toc };
}

export async function DocumentationPage({
  portal,
}: {
  portal: "admin" | "partner";
}) {
  const ids = (await readdir(GUIDE_DIR))
    .filter((f) => f.startsWith(`${portal}-`) && f.endsWith(".md"))
    .map((f) => f.slice(0, -3))
    .sort(
      (a, b) => (ORDER.indexOf(a) + 1 || 99) - (ORDER.indexOf(b) + 1 || 99),
    );
  const guides: DocumentationGuide[] = await Promise.all(
    ids.map(async (file) => {
      const id = file.slice(portal.length + 1);
      const { html, toc } = renderGuide(
        await readFile(path.join(GUIDE_DIR, `${file}.md`), "utf8"),
        id,
        portal,
      );
      return { id, label: TAB_LABEL[file] ?? id.replace(/-/g, " "), html, toc };
    }),
  );
  return <DocumentationTabs guides={guides} />;
}
