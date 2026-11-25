"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Badge } from "@/components/ui/Badge";
import { SearchField } from "@/components/ui/SearchField";
import { TabsCount, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { plural, type TemplateKey } from "../_data";
import { SkeletonBlock } from "./Skeleton";
import { TemplateChips, TemplateFilterButton } from "./TemplateFilter";

const Top = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-4) var(--space-3);
  border-bottom: 1px solid var(--color-border);
`;

/* Same as every admin page title (ListPage). */
const Title = styled.h1`
  margin: 0;
  font-size: var(--text-lg);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  letter-spacing: var(--tracking-tight);
  /* The "Skip to main content" target: shows a ring only after a keyboard-started jump. */
  align-self: flex-start;

  &:focus-visible {
    outline: none;
    border-radius: var(--radius-sm);
    box-shadow: var(--focus-ring);
  }
`;

/* The kit's grey line is the list's own bottom edge. Bleeding the list out to the header's padding makes it
   run edge to edge across the panel; the padding puts the first label back on the header's left edge. */
const FullWidthTabs = styled(TabsList)`
  /* The kit list already reserves 4px of ring room all round; the sides grow to the header's padding. */
  margin: calc(var(--space-1) * -1) calc(var(--space-4) * -1);
  padding: var(--space-1) var(--space-4);
  /* Its divider runs the full width here. */
  background-position: 0 calc(100% - var(--space-1));
  background-size: 100% 1px;
`;

/* "Couldn't send" reads like the other tabs; the kit's count badge carries the number. */
const FailBadge = styled(Badge)`
  margin-left: var(--space-2);
`;

const SearchRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
`;

const SearchSlot = styled.div`
  flex: 1 1 auto;
  min-width: 0;
`;

interface PanelHeaderProps {
  /** Left out while the counts aren't known yet (loading, or couldn't load): no counts and no Couldn't send tab. */
  counts?: { review: number; all: number; failed: number };
  searchText: string;
  onSearchText: (text: string) => void;
  onSearch: (query: string) => void;
  templates: Set<TemplateKey>;
  onTemplates: (templates: Set<TemplateKey>) => void;
  /** The days a box on the calendar picked ("Nov 10–13"), shown as a chip, or null. */
  daysLabel?: string | null;
  onClearDays?: () => void;
  /** Disables the search and the template filter, and says why. */
  /**
   * Nothing to search yet (first load, or it couldn't load): the search field and filter button are drawn as
   * quiet placeholders of the same size, so nothing moves when they arrive. `pulse` while loading.
   */
  placeholder?: "pulse" | "still" | null;
  /** A search is running: the field shows its spinner while the list keeps the previous results. */
  searching?: boolean;
  /** The name of the tab whose list is loading (State lab Slow tab switch), or null. Shows the tabs' loading underline. */
  loadingTab?: string | null;
}

/** Title, tabs, search and template filter. Renders inside the panel's Tabs root. */
export function PanelHeader({ counts, searchText, onSearchText, onSearch, templates, onTemplates, daysLabel = null, onClearDays, placeholder = null, searching = false, loadingTab = null }: PanelHeaderProps) {
  const search = (
    <SearchField
      aria-label="Search recipients by name, email, tag or template"
      placeholder="Search recipients or templates"
      value={searchText}
      onChange={(e) => onSearchText(e.target.value)}
      onSearch={onSearch}
      pending={searching}
    />
  );
  return (
    <Top>
      <Title id="outbox-title" tabIndex={-1}>Outbox</Title>
      <FullWidthTabs aria-label="Show recipients" loading={!!loadingTab} loadingLabel={loadingTab ? `Loading ${loadingTab}` : undefined}>
          <TabsTrigger value="review">
            For review
            {counts && <TabsCount>({counts.review})</TabsCount>}
          </TabsTrigger>
          <TabsTrigger value="all">
            All
            {counts && <TabsCount>({counts.all})</TabsCount>}
          </TabsTrigger>
          {counts && counts.failed > 0 && (
            <TabsTrigger value="failed" aria-label={`Couldn't send, ${plural(counts.failed, "email", "emails")}`}>
              Couldn&apos;t send
              <FailBadge $variant="count" aria-hidden="true">
                {counts.failed}
              </FailBadge>
            </TabsTrigger>
          )}
      </FullWidthTabs>
      <SearchRow>
        {placeholder ? (
          <>
            <SearchSlot>
              <SkeletonBlock $height="var(--control-height)" $radius="var(--radius-md)" $still={placeholder === "still"} />
            </SearchSlot>
            <SkeletonBlock $width="var(--control-height)" $height="var(--control-height)" $radius="var(--radius-md)" $still={placeholder === "still"} />
          </>
        ) : (
          <>
            <SearchSlot>{search}</SearchSlot>
            <TemplateFilterButton templates={templates} onTemplates={onTemplates} />
          </>
        )}
      </SearchRow>
      {(templates.size > 0 || daysLabel) && (
        <TemplateChips templates={templates} onTemplates={onTemplates} daysLabel={daysLabel} onClearDays={onClearDays} />
      )}
    </Top>
  );
}
