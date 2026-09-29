import type { Metadata } from "next";
import type { ReactNode } from "react";
import { styled } from "next-yak";
import { ButtonDemos, ColorDemos } from "./demos/BasicsDemos";
import {
  FieldDemo,
  LabelDemo,
  InputDemo,
  SearchFieldDemo,
  SelectDemo,
  CreatableComboboxDemo,
  TagInputDemo,
  ErrorSummaryDemo,
  TextareaDemo,
} from "./demos/FormDemos";
import {
  CheckboxDemo,
  DatePickerDemo,
  RadioGroupDemo,
  SliderDemo,
  SwitchDemo,
  ToggleDemo,
  ToggleGroupDemo,
} from "./demos/ControlDemos";
import { OverlayDemos } from "./demos/OverlayDemos";
import { DisplayDemos, EmptyStateDemo, ListRowDemo, TruncationDemo } from "./demos/DisplayDemos";
import { FilterTableDemo, PaginationDemo, SortableTableDemo, TableDemo } from "./demos/TableDemos";

export const metadata: Metadata = {
  title: "Components · Social Development Centre",
};

const sections: { id: string; title: string; description: string; demo: ReactNode }[] = [
  { id: "colors", title: "Colors", description: "Stone neutrals, one accent, and status colors. Tokens live in tokens.ts.", demo: <ColorDemos /> },
  { id: "buttons", title: "Buttons", description: "Primary, secondary, outline, ghost, link and danger actions in three sizes.", demo: <ButtonDemos /> },
  { id: "field", title: "Field", description: "Label, hint and error wired to any control for screen readers.", demo: <FieldDemo /> },
  { id: "label", title: "Label", description: "The visible text label for a form control, linked by htmlFor.", demo: <LabelDemo /> },
  { id: "input", title: "Input", description: "Single-line text entry.", demo: <InputDemo /> },
  { id: "search-field", title: "Search field", description: "Instant search for a list: results update 300ms after typing stops, Enter searches now, × clears.", demo: <SearchFieldDemo /> },
  { id: "textarea", title: "Textarea", description: "Multi-line text entry.", demo: <TextareaDemo /> },
  { id: "date-picker", title: "Date picker", description: "Type a date or pick one from a calendar.", demo: <DatePickerDemo /> },
  { id: "select", title: "Select", description: "Pick one option from a list.", demo: <SelectDemo /> },
  { id: "creatable-combobox", title: "Creatable combobox", description: "Pick an existing option or create one inline.", demo: <CreatableComboboxDemo /> },
  { id: "tag-input", title: "Tag input", description: "Type or paste many entries, such as email addresses; each becomes a removable tag. Invalid entries are marked with an icon and a reason. Click, Shift-click or Cmd/Ctrl-click tags to select them (Cmd/Ctrl+A in the empty field selects all), then Backspace removes and Cmd/Ctrl+C copies them.", demo: <TagInputDemo /> },
  { id: "error-summary", title: "Error summary", description: "A persistent list of a long form's errors, each linking to its field.", demo: <ErrorSummaryDemo /> },
  { id: "checkbox", title: "Checkbox", description: "Independent on/off choices, including indeterminate.", demo: <CheckboxDemo /> },
  { id: "radio", title: "Radio group", description: "One choice from a small set.", demo: <RadioGroupDemo /> },
  { id: "switch", title: "Switch", description: "Settings that apply immediately.", demo: <SwitchDemo /> },
  { id: "slider", title: "Slider", description: "Choose a value from a range.", demo: <SliderDemo /> },
  { id: "toggle", title: "Toggle", description: "A single pressable on/off button.", demo: <ToggleDemo /> },
  { id: "toggle-group", title: "Toggle group", description: "Segmented control for switching views or options.", demo: <ToggleGroupDemo /> },
  { id: "overlays", title: "Overlays", description: "Dialog, alert dialog, sheet, popover, tooltip, dropdown menu, hover card and toast.", demo: <OverlayDemos /> },
  { id: "display", title: "Display & navigation", description: "Card, badge, avatar, progress, tabs, accordion, scroll area and collapsible.", demo: <DisplayDemos /> },
  { id: "list-row", title: "List row", description: "A dense, clickable row for lists and simple tables.", demo: <ListRowDemo /> },
  { id: "table", title: "Table", description: "A semantic data table with column headers, row dividers and a clickable row.", demo: <TableDemo /> },
  { id: "table-sortable", title: "Table, sortable", description: "Select a column header to sort by it; select it again to reverse. The active column shows an arrow; others show a hint on hover or focus. While a sort loads, the arrow becomes a spinner (sortPending); while any rows load (busy), rows dim in place and a line runs under the header.", demo: <SortableTableDemo /> },
  { id: "table-filters", title: "Table, filters and frozen columns", description: "Filters live in column headers: the filter icon opens a checkbox list; changes apply with Apply, Clear selects everything, and closing discards. An active filter shows its count. The first two columns freeze only when the table overflows, with a divider and shadow once scrolled sideways (only the first below 600px). Organization and Email have fixed widths and truncate. The Tags column is hidden because no row has tags.", demo: <FilterTableDemo /> },
  { id: "truncation", title: "Truncated text and email", description: "One line with an ellipsis. TruncatedText shows the full text in a tooltip only when it's cut off; TruncatedEmail keeps the @domain whole and shortens the name part.", demo: <TruncationDemo /> },
  { id: "empty-state", title: "Empty state", description: "An empty list, section or no-results placeholder. Lists use ListEmptyState, which picks the variant: matches elsewhere, no matches, filters, search plus filters, truly empty.", demo: <EmptyStateDemo /> },
  { id: "pagination", title: "Pagination", description: "Page summary, Previous/Next and page numbers for a paged list.", demo: <PaginationDemo /> },
];

const Shell = styled.div`
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
  gap: var(--space-8);
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-6);

  @media (max-width: 800px) {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-6);
    padding: var(--space-6) var(--space-4);
  }
`;

const Nav = styled.nav`
  position: sticky;
  top: var(--space-6);
  align-self: start;
  display: grid;
  gap: var(--space-1);

  @media (max-width: 800px) {
    position: static;
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
`;

const NavLink = styled.a`
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  text-decoration: none;
  transition: color var(--duration) var(--ease), background-color var(--duration) var(--ease);

  &:hover {
    color: var(--color-text);
    background: var(--color-surface);
  }
  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

const Header = styled.header`
  display: grid;
  gap: var(--space-3);
  margin-bottom: var(--space-7);
`;

const Title = styled.h1`
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--text-display);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-tight);
  line-height: 1;
`;

const Lede = styled.p`
  margin: 0;
  max-width: 56ch;
  color: var(--color-text-muted);
  font-size: var(--text-lg);
`;

const Section = styled.section`
  display: grid;
  gap: var(--space-5);
  padding: var(--space-7) 0;
  border-top: 1px solid var(--color-border);
  scroll-margin-top: var(--space-6);
`;

const SectionHead = styled.div`
  display: grid;
  gap: var(--space-2);
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-tight);
  line-height: 1.1;
`;

const SectionDescription = styled.p`
  margin: 0;
  color: var(--color-text-muted);
`;

const Preview = styled.div`
  padding: var(--space-6);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg);

  @media (max-width: 800px) {
    padding: var(--space-4);
  }
`;

export default function ComponentsPage() {
  return (
    <Shell>
      <Nav aria-label="Components">
        {sections.map((s) => (
          <NavLink key={s.id} href={`#${s.id}`}>
            {s.title}
          </NavLink>
        ))}
      </Nav>
      <main>
        <Header>
          <Title>Components</Title>
          <Lede>
            Every building block in the Social Development Centre UI kit, in
            every state. Built on Radix primitives for keyboard and screen
            reader support.
          </Lede>
        </Header>
        {sections.map((s) => (
          <Section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`}>
            <SectionHead>
              <SectionTitle id={`${s.id}-title`}>{s.title}</SectionTitle>
              <SectionDescription>{s.description}</SectionDescription>
            </SectionHead>
            <Preview>{s.demo}</Preview>
          </Section>
        ))}
      </main>
    </Shell>
  );
}
