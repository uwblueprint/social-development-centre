"use client";

import { styled } from "next-yak";
import { BadgeCheck, Ban, CalendarDays, Link2, Link2Off, UserPlus } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import { type AutomaticEmail, audienceSentence, effectiveAudience, joinedPhrase, tagColor } from "../_data";

/*
 * Who gets an automatic email, as pills, drawn exactly like the tags in the editor's Who gets it rows:
 *   [Volunteer] [Board]      plain, in its colour: people with any of these get it. No "or" between them:
 *                            next to other pills it read as "Volunteer or (Board and not Lapsed)"
 *   [✓ $1,000+]              BadgeCheck inside: they must have this tag
 *   [⊘ Lapsed]               a red Ban inside, the tag keeps its colour: people with it never get it
 *   [📅 Joined after Jan 1]  outlined: a date rule, not a tag
 * No rule shows nothing: no rule means everyone. Screen readers get the sentence; the pills are its picture.
 */

const Row = styled.span`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  align-items: center;
  min-width: 0;
`;

/* A date or referral rule is a filter, not a tag: outlined, no fill. */
const RulePill = styled(Tag)`
  background: transparent;
  box-shadow: inset 0 0 0 1px var(--color-border);
  color: var(--color-text-muted);
`;

/* The editor's exclusion icon: red, while the tag keeps its own colour (TagCombobox pillIconTone="danger"). */
const Danger = styled.span`
  display: inline-flex;
  color: var(--color-danger);
`;

const SrOnly = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
`;

/**
 * One tag as the editor draws it. `mark`: "must" adds the check, "not" adds the red ban.
 * `selected` (filter chips): the tag's dark ink as a solid fill with light, medium-weight text, so a
 * picked chip stands out by brightness and weight, not by hue alone. An excluded chip is solid too,
 * with a white ban: the icon is what tells "doesn't have" from "has".
 */
export function TagPill({ tag, mark, selected }: { tag: string; mark?: "must" | "not"; selected?: boolean }) {
  const color = tagColor(tag);
  return (
    <Tag
      color={color}
      style={
        selected
          ? { background: color ? `var(--tag-${color}-text)` : "var(--color-text)", color: "var(--color-bg)", fontWeight: "var(--weight-medium)" }
          : undefined
      }
    >
      {mark === "must" && <Icon icon={BadgeCheck} size={14} />}
      {mark === "not" &&
        (selected ? (
          // On the solid fill the ban takes the text colour (white), like the tag name.
          <Icon icon={Ban} size={14} />
        ) : (
          <Danger>
            <Icon icon={Ban} size={14} />
          </Danger>
        ))}
      {tag}
    </Tag>
  );
}

export function AudiencePills({ email }: { email: AutomaticEmail }) {
  const a = effectiveAudience(email);
  const referrer = email.trigger === "refers" || email.trigger === "ref_joins";
  const date = joinedPhrase(a.joined);
  const sentence = `${referrer ? "Sent to the person who referred them. " : ""}${audienceSentence(a)}`;

  return (
    <Row>
      <SrOnly>{sentence}</SrOnly>
      <Row aria-hidden>
        {referrer && (
          <Tag>
            <Icon icon={UserPlus} size={14} />
            Who referred them
          </Tag>
        )}
        {a.only.map((t) => <TagPill key={t} tag={t} />)}
        {a.require.map((t) => <TagPill key={t} tag={t} mark="must" />)}
        {email.trigger === "join_noref" && (
          <RulePill>
            <Icon icon={Link2Off} size={14} />
            No referral
          </RulePill>
        )}
        {email.trigger === "join_ref" && (
          <RulePill>
            <Icon icon={Link2} size={14} />
            Referred
          </RulePill>
        )}
        {date && (
          <RulePill>
            <Icon icon={CalendarDays} size={14} />
            Joined {date}
          </RulePill>
        )}
        {a.never.map((t) => <TagPill key={t} tag={t} mark="not" />)}
      </Row>
    </Row>
  );
}
