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
