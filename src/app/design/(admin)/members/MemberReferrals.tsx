"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Copy, Link2, Mail, UserPlus } from "lucide-react";
import { ListPage, ListPageHeader } from "@/components/patterns/ListPage";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogActions, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { RadioGroup, RadioGroupOption } from "@/components/ui/RadioGroup";
import { AppToastProvider, useToast } from "@/components/ui/Toast";
import {
  demoFriendLink,
  EMAIL_PATTERN,
  MEMBER,
  SEED_ACTIVITY,
  SEED_REFERRALS,
  STATUS_LABEL,
  joinedAsText,
  type Activity,
  type MemberReferral,
  type ReferralStatus,
} from "./data";

/*
 * The admin side of Referrals, on one member's profile in the Member Directory (PM notes, Nov 2026).
 * - "Refer someone for Maya": for members who aren't comfortable with the email link. The admin enters
 *   the friend's name and email, then SDC emails them once, or the admin gets the friend's link to pass on.
 *   Same rules as the member's own page (refer_friend): one SDC email per friend address, ever.
 * - "Copy Maya's refer link": Maya's own Refer a friend page, to send her if she can't find it.
 * - What changes when a referral happens: a row under Referrals (with how it was made and its status),
 *   and a line in Activity. When the friend joins, the row turns "Joined" and the friend's own profile
 *   shows "Referred by Maya".
 * Admins see everything; the member's page never reveals anything about the friend.
 */

type Delivery = "email" | "link";

const Layout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 300px);
  gap: var(--space-6);
  align-items: start;

  @media (max-width: 1023px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

const SectionHead = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2) var(--space-3);

  & h2 {
    margin: 0;
    font-size: var(--text-lg);
    font-weight: var(--weight-medium);
    line-height: var(--leading-heading);
    color: var(--color-text);
  }
`;

const Count = styled.span`
  margin-left: var(--space-2);
  font-size: var(--text-sm);
  font-weight: var(--weight-regular);
  color: var(--color-text-muted);
`;

const Rows = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--color-border);

  & > li {
    border-bottom: 1px solid var(--color-border);
  }
`;

const Row = styled.li`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--space-1) var(--space-4);
  align-items: center;
  padding: var(--space-3) 0;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);

  @media (max-width: 479px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Who = styled.div`
  min-width: 0;

  & strong {
    display: block;
    font-weight: var(--weight-medium);
    color: var(--color-text);
  }
  & span {
    display: block;
    overflow-wrap: anywhere;
    color: var(--color-text-muted);
  }
`;

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  justify-content: flex-end;
  color: var(--color-text-muted);

  @media (max-width: 479px) {
    justify-content: flex-start;
  }
`;

const Aside = styled.aside`
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
`;

const Facts = styled.dl`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--space-2) var(--space-3);
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);

  & dt {
    color: var(--color-text-muted);
  }
  & dd {
    margin: 0;
    overflow-wrap: anywhere;
    color: var(--color-text);
  }
`;

const Timeline = styled.ol`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);

  & li {
    display: flex;
    justify-content: space-between;
    gap: var(--space-3);
    color: var(--color-text);
  }
  & time {
    flex: none;
    color: var(--color-text-muted);
  }
`;

const DialogForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`;

const LinkRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--space-2);

  @media (max-width: 399px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

/* Under a Joined row whose joiner isn't the invited address. Overrides Who's plain span style. */
const JoinedAs = styled.em`
  display: block;
  margin-top: 2px;
  font-style: normal;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

const Hint = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
`;

const STATUS_VARIANT: Record<ReferralStatus, "info" | "neutral" | "success"> = {
  emailed: "info",
  link: "neutral",
  joined: "success",
};

export function MemberReferrals() {
  return (
    <AppToastProvider>
      <Profile />
    </AppToastProvider>
  );
}

function Profile() {
  const { toast } = useToast();
  const [referrals, setReferrals] = React.useState<MemberReferral[]>(SEED_REFERRALS);
  const [activity, setActivity] = React.useState<Activity[]>(SEED_ACTIVITY);
  const [open, setOpen] = React.useState(false);

  async function copy(text: string, title: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title });
    } catch {
      toast({ title: "Couldn't copy", description: "Select the link and copy it instead." });
    }
  }

  function added(referral: MemberReferral) {
    setReferrals((list) => [referral, ...list]);
    setActivity((list) => [
      { id: `a-${referral.id}`, text: `Referred ${referral.friendName} (added by you)`, on: referral.referredOn },
      ...list,
    ]);
    toast({ title: `Referral added to ${MEMBER.firstName}'s profile` });
  }

  return (
    <ListPage>
      <ListPageHeader
        title={MEMBER.fullName}
        actions={
          <>
            <Button type="button" $variant="outline" onClick={() => copy(MEMBER.referPageLink, "Refer a friend link copied")}>
              <Icon icon={Link2} />
              Copy {MEMBER.firstName}&rsquo;s refer link
            </Button>
            <Button type="button" onClick={() => setOpen(true)}>
              <Icon icon={UserPlus} />
              Refer someone for {MEMBER.firstName}
            </Button>
          </>
        }
      />

      <Layout>
        <Section aria-labelledby="referrals-title">
          <SectionHead>
            <h2 id="referrals-title">
              Referrals<Count>{referrals.length}</Count>
            </h2>
          </SectionHead>
          <Rows>
            {referrals.map((r) => (
              <Row key={r.id}>
                <Who>
                  <strong>{r.friendName}</strong>
                  <span>{r.friendEmail}</span>
                  {joinedAsText(r) && <JoinedAs>{joinedAsText(r)}</JoinedAs>}
                </Who>
                <Meta>
                  <span>
                    {r.referredOn} · {r.by === "admin" ? "added by an admin" : `by ${MEMBER.firstName}`}
                  </span>
                  <Badge $variant={STATUS_VARIANT[r.status]}>
                    {STATUS_LABEL[r.status]}
                    {r.joinedOn ? ` ${r.joinedOn}` : ""}
                  </Badge>
                </Meta>
              </Row>
            ))}
          </Rows>
          <Hint>
            &ldquo;Invite emailed&rdquo;: SDC emailed them once. &ldquo;Link shared&rdquo;: someone passed on their
            link. A referral turns &ldquo;Joined&rdquo; when someone joins through its link, even with another
            email or if the link was passed on; the line under the name then says who actually joined.
          </Hint>
        </Section>

        <Aside aria-label={`About ${MEMBER.firstName}`}>
          <Facts>
            <dt>Email</dt>
            <dd>{MEMBER.email}</dd>
            <dt>Joined</dt>
            <dd>{MEMBER.joinedOn}</dd>
            <dt>Referred by</dt>
            <dd>{MEMBER.referredBy}</dd>
          </Facts>
          <Section aria-labelledby="activity-title">
            <SectionHead>
              <h2 id="activity-title">Activity</h2>
            </SectionHead>
            <Timeline>
              {activity.map((a) => (
                <li key={a.id}>
                  <span>{a.text}</span>
                  <time>{a.on}</time>
                </li>
              ))}
            </Timeline>
          </Section>
        </Aside>
      </Layout>

      <ReferDialog open={open} onOpenChange={setOpen} onAdded={added} onCopy={copy} taken={referrals} />
    </ListPage>
  );
}

function ReferDialog({
  open,
  onOpenChange,
  onAdded,
  onCopy,
  taken,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: (referral: MemberReferral) => void;
  onCopy: (text: string, title: string) => void;
  taken: MemberReferral[];
}) {
  const [delivery, setDelivery] = React.useState<Delivery>("email");
  const [errors, setErrors] = React.useState<{ name?: string; email?: string }>({});
  const [result, setResult] = React.useState<MemberReferral | null>(null);

  function reset(next: boolean) {
    if (!next) {
      setDelivery("email");
      setErrors({});
      setResult(null);
    }
    onOpenChange(next);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim().toLowerCase();
    const found: { name?: string; email?: string } = {};
    if (!name) found.name = "Enter their name.";
    if (!EMAIL_PATTERN.test(email)) found.email = "Enter an email address like name@example.org.";
    else if (email === MEMBER.email) found.email = `That's ${MEMBER.firstName}'s own email address.`;
    else if (taken.some((r) => r.friendEmail === email)) found.email = `${MEMBER.firstName} already referred this person.`;
    setErrors(found);
    if (found.name || found.email) return;
    const referral: MemberReferral = {
      id: `new-${Date.now()}`,
      friendName: name,
      friendEmail: email,
      referredOn: "Nov 19",
      by: "admin",
      status: delivery === "email" ? "emailed" : "link",
    };
    setResult(referral);
    onAdded(referral);
  }

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogContent>
        {result ? (
          <>
            <DialogTitle>{result.status === "emailed" ? `SDC will email ${result.friendName}` : `${result.friendName}'s link`}</DialogTitle>
            <DialogDescription>
              {result.status === "emailed"
                ? `They get one email from SDC saying ${MEMBER.firstName} referred them, with a link to join. It's on ${MEMBER.firstName}'s profile now.`
                : `Give this link to ${MEMBER.firstName} to send, or send it to ${result.friendName} yourself. If they join through it, ${MEMBER.firstName} gets the credit.`}
            </DialogDescription>
            {result.status === "link" && (
              <Field label="Link">
                {(p) => (
                  <LinkRow>
                    <Input {...p} readOnly value={demoFriendLink(result.id)} />
                    <Button type="button" $variant="outline" onClick={() => onCopy(demoFriendLink(result.id), "Link copied")}>
                      <Icon icon={Copy} />
                      Copy link
                    </Button>
                  </LinkRow>
                )}
              </Field>
            )}
            <DialogActions>
              <DialogClose asChild>
                <Button type="button">Done</Button>
              </DialogClose>
            </DialogActions>
          </>
        ) : (
          <>
            <DialogTitle>Refer someone for {MEMBER.firstName}</DialogTitle>
            <DialogDescription>
              For when {MEMBER.firstName} tells you about a friend, by phone or in person. It counts as{" "}
              {MEMBER.firstName}&rsquo;s referral.
            </DialogDescription>
            <DialogForm onSubmit={submit} noValidate>
              <Field label="Their name" required error={errors.name}>
                {(p) => <Input {...p} name="name" autoComplete="off" maxLength={80} />}
              </Field>
              <Field label="Their email address" required error={errors.email}>
                {(p) => <Input {...p} name="email" type="email" autoComplete="off" maxLength={254} />}
              </Field>
              <div>
                <Label id="admin-delivery">How should they hear about SDC?</Label>
                <RadioGroup
                  name="delivery"
                  value={delivery}
                  onValueChange={(v) => setDelivery(v as Delivery)}
                  aria-labelledby="admin-delivery"
                >
                  <RadioGroupOption value="email" label="SDC emails them" />
                  <RadioGroupOption value="link" label="Get a link to pass on" />
                </RadioGroup>
              </div>
              <DialogActions>
                <DialogClose asChild>
                  <Button type="button" $variant="ghost">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit">
                  <Icon icon={delivery === "email" ? Mail : Link2} />
                  {delivery === "email" ? "Send invite" : "Get link"}
                </Button>
              </DialogActions>
            </DialogForm>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
