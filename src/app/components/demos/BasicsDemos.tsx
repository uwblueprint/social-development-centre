"use client";

import { styled } from "next-yak";
import { Button } from "@/components/ui/Button";
import { DisabledReason } from "@/components/ui/DisabledReason";

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
`;

const Stack = styled.div`
  display: grid;
  gap: var(--space-5);
`;


export function ButtonDemos() {
  return (
    <Stack>
      <Row>
        <Button>Primary</Button>
        <Button $variant="secondary">Secondary</Button>
        <Button $variant="outline">Outline</Button>
        <Button $variant="ghost">Ghost</Button>
        <Button $variant="danger">Delete</Button>
      </Row>
      <Row>
        <Button $size="sm">Small</Button>
        <Button $size="md">Medium</Button>
        <Button $size="lg">Large</Button>
      </Row>
      <Row>
        <DisabledReason reason="Add at least one volunteer before publishing.">
          <Button disabled>Publish</Button>
        </DisabledReason>
        <DisabledReason reason="Only organization admins can export data.">
          <Button $variant="secondary" disabled>
            Export
          </Button>
        </DisabledReason>
      </Row>
    </Stack>
  );
}

const SwatchGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: var(--space-3);
`;

const SwatchGroup = styled.div`
  display: grid;
  gap: var(--space-2);
`;

const GroupTitle = styled.p`
  margin: var(--space-3) 0 0;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  line-height: var(--leading-ui);
`;

const Chip = styled.div`
  height: 48px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
`;

const SwatchName = styled.span`
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
`;

const palette: { title: string; tokens: string[] }[] = [
  {
    title: "Stone neutrals",
    tokens: ["stone-50", "stone-100", "stone-200", "stone-300", "stone-400", "stone-500", "stone-600", "stone-700", "stone-800", "stone-900"],
  },
  { title: "Accent (one per screen)", tokens: ["color-accent", "color-accent-hover", "color-accent-subtle", "color-accent-border"] },
  {
    title: "Status (always paired with an icon or label)",
    tokens: ["color-success", "color-success-subtle", "color-warning", "color-warning-subtle", "color-danger", "color-danger-subtle", "color-info", "color-info-subtle"],
  },
];

export function ColorDemos() {
  return (
    <div>
      {palette.map((group) => (
        <SwatchGroup key={group.title}>
          <GroupTitle>{group.title}</GroupTitle>
          <SwatchGrid>
            {group.tokens.map((token) => (
              <SwatchGroup key={token}>
                <Chip style={{ background: `var(--${token})` }} />
                <SwatchName>--{token}</SwatchName>
              </SwatchGroup>
            ))}
          </SwatchGrid>
        </SwatchGroup>
      ))}
    </div>
  );
}
