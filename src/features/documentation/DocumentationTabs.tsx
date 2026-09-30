"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { BookOpen, BriefcaseBusiness, Building, ChartColumnIncreasing, Compass, UsersRound, type LucideIcon } from "lucide-react";
import { styled } from "next-yak";
import {
  ListPage,
  ListPageHeader,
  useListParams,
} from "@/components/patterns/ListPage";
import { Icon } from "@/components/ui/Icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";

/** The same icons as the sidebar items (AdminShell / PartnerShell); guides not in the nav get a compass. */
const GUIDE_ICON: Record<string, LucideIcon> = {
  "getting-around": Compass,
  "getting-started": Compass,
  opportunities: BriefcaseBusiness,
  insights: ChartColumnIncreasing,
  community: UsersRound,
  partners: Building,
};

export interface TocEntry {
  id: string;
  label: string;
  level: 2 | 3;
}

export interface DocumentationGuide {
  id: string;
  label: string;
  /** Rendered from the guide's Markdown on the server. */
  html: string;
  toc: TocEntry[];
}

/*
 * Layout: a sticky "On this page" list on the left
 * that highlights the section in view, and one readable column of text. Below 900px the list sits
 * above the article instead.
 */
const TabLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
`;

const Layout = styled.div`
  display: grid;
  /* Text starts a fixed gap after the contents list (not centred); the spare width stays on the right. */
  grid-template-columns: 200px minmax(0, 1fr);
  gap: var(--space-8);
  align-items: start;

  @media (max-width: 899px) {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-5);
  }
`;

const Toc = styled.nav`
  position: sticky;
  top: var(--space-5);
  max-height: calc(100vh - var(--space-7));
  overflow-y: auto;

  @media (max-width: 899px) {
    position: static;
    max-height: none;
    padding-bottom: var(--space-4);
    border-bottom: 1px solid var(--color-border);
  }
`;

const TocTitle = styled.p`
  margin: 0 0 var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--color-text-muted);
`;

const TocList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  border-left: 1px solid var(--color-border);
`;

const TocLink = styled.a`
  display: block;
  margin-left: -1px;
  padding: 6px var(--space-3);
  border-left: 2px solid transparent;
  font-size: var(--text-xs);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
  text-decoration: none;
  transition:
    color var(--duration) var(--ease),
    border-color var(--duration) var(--ease);

  &[data-level="3"] {
    padding-top: var(--space-1);
    padding-bottom: var(--space-1);
    padding-left: var(--space-5);
  }
  &:hover {
    color: var(--color-text);
  }
  /* Current section: text color plus a left bar (never color alone). */
  &[aria-current="location"] {
    color: var(--color-text);
    font-weight: var(--weight-medium);
    border-left-color: var(--color-text);
  }
  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
    border-radius: var(--radius-sm);
  }
`;

const Prose = styled.article`
  min-width: 0;
  width: 100%;
  max-width: 60ch;
  font-size: var(--text-sm);
  line-height: var(--leading-prose);
  letter-spacing: var(--tracking-prose);
  color: var(--color-text-muted);

  & > :first-child {
    margin-top: 0;
  }
  h2,
  h3,
  h4 {
    scroll-margin-top: var(--space-5);
    font-weight: var(--weight-medium);
    line-height: var(--leading-heading);
  }
  h2,
  h3,
  h4,
  strong {
    color: var(--color-text);
  }
  h2 {
    margin: var(--space-5) 0 var(--space-3);
    padding-top: var(--space-5);
    border-top: 1px solid var(--color-border);
    font-size: var(--text-lg);
  }
  & > h2:first-child {
    padding-top: 0;
    border-top: 0;
  }
  h3 {
    margin: var(--space-5) 0 var(--space-2);
    font-size: var(--text-md);
  }
  h4 {
    margin: var(--space-4) 0 var(--space-2);
    font-size: var(--text-sm);
  }
  p,
  ul,
  ol,
  blockquote {
    margin: 0 0 var(--space-3);
  }
  ul,
  ol {
    padding-left: var(--space-5);
  }
  li + li {
    margin-top: var(--space-1);
  }
  li::marker {
    color: var(--color-text-muted);
  }
  /* Design system: emphasis is medium weight at the small size, never bold. */
  strong {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    line-height: var(--leading-ui);
  }
  a {
    color: var(--color-text);
    text-decoration: underline;
    text-underline-offset: 3px;
    text-decoration-color: var(--color-border-strong);
  }
  a:hover {
    text-decoration-color: currentColor;
  }
  a:focus-visible,
  .doc-table:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
    border-radius: var(--radius-sm);
  }
  code {
    padding: 1px var(--space-1);
    border-radius: var(--radius-sm);
    background: var(--color-bg-hover);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
  }
  blockquote {
    padding: var(--space-3);
    border: 1px solid var(--color-info-border);
    border-radius: var(--radius-md);
    background: var(--color-info-subtle);
  }
  blockquote > :last-child {
    margin-bottom: 0;
  }
  hr {
    margin: var(--space-5) 0;
    border: 0;
    border-top: 1px solid var(--color-border);
  }
  img {
    display: block;
    max-width: 100%;
    height: auto;
    margin: var(--space-3) 0 var(--space-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }
  figure {
    margin: var(--space-3) 0 var(--space-4);
  }
  figure img {
    margin: 0 0 var(--space-2);
  }
  figcaption {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }
  .doc-table {
    margin: 0 0 var(--space-4);
    overflow-x: auto;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th,
  td {
    padding: var(--space-2) var(--space-3);
    border-bottom: 1px solid var(--color-border);
    text-align: left;
    vertical-align: top;
    line-height: var(--leading-ui);
  }
  th {
    background: var(--color-bg-hover);
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    color: var(--color-text-muted);
    white-space: nowrap;
  }
  tr:last-child td {
    border-bottom: 0;
  }
`;

/** The id of the last heading scrolled past the top of the viewport, for the contents highlight. */
function useActiveHeading(ids: string[]) {
  const [active, setActive] = React.useState(ids[0]);
  React.useEffect(() => {
    const headings = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (headings.length === 0) return;
    const onScroll = () => {
      let current = headings[0].id;
      for (const h of headings)
        if (h.getBoundingClientRect().top <= 96) current = h.id;
      setActive(current);
    };
    // Capture: the page scrolls inside the portal's main area, not the window.
    document.addEventListener("scroll", onScroll, {
      capture: true,
      passive: true,
    });
    const frame = requestAnimationFrame(onScroll);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("scroll", onScroll, { capture: true });
    };
  }, [ids]);
  return active;
}

function GuideView({ guide }: { guide: DocumentationGuide }) {
  const ids = React.useMemo(() => guide.toc.map((t) => t.id), [guide.toc]);
  const active = useActiveHeading(ids);
  // Sub-headings only show under the section you're reading, so long guides don't become a wall of links.
  const sectionOf = React.useMemo(() => {
    const map = new Map<string, string>();
    let section = "";
    for (const t of guide.toc) {
      if (t.level === 2) section = t.id;
      map.set(t.id, section);
    }
    return map;
  }, [guide.toc]);
  const activeSection = active ? sectionOf.get(active) : undefined;
  const visible = guide.toc.filter((t) => t.level === 2 || sectionOf.get(t.id) === activeSection);
  return (
    <Layout>
      {guide.toc.length > 0 && (
        <Toc aria-label="On this page">
          <TocTitle>On this page</TocTitle>
          <TocList>
            {visible.map((t) => (
              <li key={t.id}>
                <TocLink
                  href={`#${t.id}`}
                  data-level={t.level}
                  aria-current={t.id === active ? "location" : undefined}
                >
                  {t.label}
                </TocLink>
              </li>
            ))}
          </TocList>
        </Toc>
      )}
      <Prose dangerouslySetInnerHTML={{ __html: guide.html }} />
    </Layout>
  );
}

/** The ListPage layout with one tab per guide; the open guide is `?guide=` so it can be linked to. */
export function DocumentationTabs({
  guides,
}: {
  guides: DocumentationGuide[];
}) {
  const { setParams } = useListParams();
  const requested = useSearchParams().get("guide");
  const active = guides.find((g) => g.id === requested)?.id ?? guides[0]?.id;
  return (
    <ListPage>
      <ListPageHeader title="Documentation" />
      <Tabs value={active} onValueChange={(guide) => setParams({ guide })}>
        <TabsList aria-label="Guides">
          {guides.map((g) => (
            <TabsTrigger key={g.id} value={g.id}>
              <TabLabel>
                <Icon icon={GUIDE_ICON[g.id] ?? BookOpen} size={16} />
                {g.label}
              </TabLabel>
            </TabsTrigger>
          ))}
        </TabsList>
        {/* Only the open guide is mounted, so the contents list tracks just its headings. */}
        {guides
          .filter((g) => g.id === active)
          .map((g) => (
            <TabsContent key={g.id} value={g.id}>
              <GuideView guide={g} />
            </TabsContent>
          ))}
      </Tabs>
    </ListPage>
  );
}
