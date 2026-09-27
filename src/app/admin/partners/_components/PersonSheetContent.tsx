"use client";

import { styled } from "next-yak";
import { ChevronRight, MailX, RotateCw, UserMinus, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DisabledReason } from "@/components/ui/DisabledReason";
import { Icon } from "@/components/ui/Icon";
import { SheetBody, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { invitationCopy, partnersCopy } from "../_copy";
import type { PartnerPerson } from "../_data/types";
import { formatDate } from "../_lib/format";
import { adminConfirmCopy, adminPersonHandlers, PersonEditForm } from "./ContactRow";
import { ContactMeta, InvitationStatus, resendLabel } from "./ContactRowParts";
import { usePersonActions } from "./PersonActions";

const copy = partnersCopy.personPanel;

const SectionTitle = styled.h3`
  margin: 0 0 var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
`;

const OrganizationLine = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
`;

/**
 * A person's panel (People view): headed with their name, their organization as related information
 * (opens the organization's panel), their invitation state and the actions that state allows.
 */
export function PersonSheetContent({
  person,
  lastWithAccess,
  onOpenOrganization,
  onInviteAgain,
}: {
  person: PartnerPerson;
  lastWithAccess: boolean;
  onOpenOrganization: () => void;
  /** Opens Invite partner filled in with this person and their organization. */
  onInviteAgain: () => void;
}) {
  const { toast } = useToast();
  const actions = usePersonActions(person, adminPersonHandlers, adminConfirmCopy(person.organization.name), (result) => {
    if (result.message) toast({ title: result.message });
  });
  const state = person.invitationState;
  const removed = !!person.removal;
  const orgStatus = person.organization.status;

  return (
    <>
      <SheetHeader>
        <SheetTitle>{person.name}</SheetTitle>
        <SheetDescription>{person.email}</SheetDescription>
        {removed ? (
          <ContactMeta>
            {person.removal === "organization"
              ? copy.organizationRemoved(person.organization.name)
              : person.removedAt && copy.removedOn(formatDate(person.removedAt))}
          </ContactMeta>
        ) : (
          <InvitationStatus contact={person} />
        )}
      </SheetHeader>

      <SheetBody>
        <Sections>
          <section aria-label={copy.organizationHeading}>
            <SectionTitle>{copy.organizationHeading}</SectionTitle>
            <OrganizationLine>
              <Button type="button" $variant="ghost" onClick={onOpenOrganization}>
                {person.organization.name}
                <Icon icon={ChevronRight} size={16} />
              </Button>
              {orgStatus === "removed" && <Badge $variant="outline">{partnersCopy.badges.removed}</Badge>}
              {orgStatus === "pending" && <Badge $variant="neutral">{partnersCopy.badges.awaitingResponse}</Badge>}
            </OrganizationLine>
          </section>
          {!removed && (
            <section aria-label={copy.detailsHeading}>
              <SectionTitle>{copy.detailsHeading}</SectionTitle>
              <PersonEditForm key={`${person.id}-${person.name}-${person.email}`} contact={person} />
            </section>
          )}
        </Sections>
      </SheetBody>

      <SheetFooter>
        {removed ? (
          <Button type="button" $variant="secondary" onClick={onInviteAgain}>
            <Icon icon={UserPlus} size={16} />
            {copy.inviteAgain}
          </Button>
        ) : state ? (
          <>
            <Button type="button" $variant="secondary" onClick={actions.requestCancel}>
              <Icon icon={MailX} size={16} />
              {invitationCopy.cancel}
            </Button>
            <Button type="button" onClick={actions.resend}>
              <Icon icon={RotateCw} size={16} />
              {resendLabel(state)}
            </Button>
          </>
        ) : lastWithAccess ? (
          <DisabledReason reason={partnersCopy.person.lastPersonReason}>
            <Button type="button" $variant="danger" disabled>
              <Icon icon={UserMinus} size={16} />
              {partnersCopy.person.remove}
            </Button>
          </DisabledReason>
        ) : (
          <Button type="button" $variant="danger" onClick={actions.requestRemove}>
            <Icon icon={UserMinus} size={16} />
            {partnersCopy.person.remove}
          </Button>
        )}
      </SheetFooter>
      {actions.dialog}
    </>
  );
}
