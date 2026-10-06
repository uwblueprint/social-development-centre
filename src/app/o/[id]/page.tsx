import type { Metadata } from "next";
import { Clock, ExternalLink } from "lucide-react";
import { styled } from "next-yak";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { AuthHeading, IconWell, LinkButton, SdcLogo } from "@/features/auth/AuthLayout";
import { sharedOpportunityCopy as copy } from "@/features/auth/copy";
import { KIND_CATEGORY, KIND_LABEL } from "@/features/opportunities/catalog";
import { KindIcon } from "@/features/opportunities/components/KindIcon";
import { formatWhenLine, formatWhere } from "@/features/opportunities/format";
import { getOpportunity } from "@/features/opportunities/queries";
import type { Opportunity } from "@/features/opportunities/types";
import { NewsletterSignup } from "./NewsletterSignup";

/*
 * Backend: this page is public (no sign-in) and must only ever show published, current listings.
 * Replace this read with a public getter that returns null for drafts, closed and removed listings
 * (docs/backend/auth.md, "Shared opportunity page"). The admin actor here is a stand-in for the mock store.
 */
async function getSharedOpportunity(id: string): Promise<Opportunity | null> {
  const o = await getOpportunity({ role: "admin", name: "Public page" }, id);
  return o?.status === "published" ? o : null;
}

const Page = styled.div`
  min-height: 100vh;
  background: var(--color-bg);
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-4);
`;

const Main = styled.main`
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-5) var(--space-4) var(--space-8);
`;

const Article = styled.article`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-4);
`;

const Title = styled.h1`
  margin: 0;
  font-size: var(--text-xl);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  letter-spacing: var(--tracking-tight);
  color: var(--color-brand-heading);
  overflow-wrap: anywhere;
`;

const Meta = styled.ul`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
`;

const Summary = styled.p`
  margin: 0;
  max-width: 60ch;
  font-size: var(--text-md);
  line-height: var(--leading-body);
  color: var(--color-text);
  white-space: pre-line;
`;

const Unavailable = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-5);
  padding: var(--space-6) 0;
`;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const o = await getSharedOpportunity((await params).id);
  return { title: `${o ? o.title : copy.unavailable.title} · Social Development Centre` };
}

/**
 * The public page behind a shared opportunity link (member screens 8–11). Anyone can read it and join
 * the newsletter; members sign in from the header and come back here (screen 11). A deleted listing or a
 * past event keeps the newsletter signup, so the visit isn't a dead end (screen 10).
 */
export default async function SharedOpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = await getSharedOpportunity(id);
  const when = o && formatWhenLine(o);
  const where = o && formatWhere(o);

  return (
    <Page>
      <Header>
        <SdcLogo size="sm" />
        <LinkButton href={`/login?next=${encodeURIComponent(`/o/${id}`)}`} $variant="outline" $size="md">
          {copy.memberSignIn}
        </LinkButton>
      </Header>
      <Main>
        {o ? (
          <Article>
            <Badge $category={KIND_CATEGORY[o.kind]}>
              <KindIcon kind={o.kind} size={12} />
              {KIND_LABEL[o.kind]}
            </Badge>
            <Title>{o.title}</Title>
            <Meta>
              <li>{copy.postedBy(o.organization.name)}</li>
              {when && <li>{when}</li>}
              {where && <li>{where}</li>}
            </Meta>
            {o.summary && <Summary>{o.summary}</Summary>}
            {o.link && (
              <LinkButton href={o.link} target="_blank" rel="noopener noreferrer">
                {copy.openLink}
                <Icon icon={ExternalLink} size={16} />
              </LinkButton>
            )}
          </Article>
        ) : (
          <Unavailable>
            <IconWell icon={Clock} tone="neutral" />
            <AuthHeading title={copy.unavailable.title} description={copy.unavailable.description} />
          </Unavailable>
        )}
        <NewsletterSignup opportunityId={id} />
      </Main>
    </Page>
  );
}
