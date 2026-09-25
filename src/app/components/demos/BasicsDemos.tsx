"use client";

import { styled } from "next-yak";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
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

const SwitchRow = styled.label`
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--text-sm);
  cursor: pointer;
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

const SwitchList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4) var(--space-6);
`;

export function SwitchDemos() {
  return (
    <SwitchList>
      <SwitchRow>
        <Switch defaultChecked /> Email notifications
      </SwitchRow>
      <SwitchRow>
        <Switch /> SMS alerts
      </SwitchRow>
      <SwitchRow>
        <Switch disabled /> Disabled
      </SwitchRow>
    </SwitchList>
  );
}
