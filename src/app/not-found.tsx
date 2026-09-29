import type { Metadata } from "next";
import { styled } from "next-yak";
import { BrandIllustration } from "./_components/BrandIllustration";
import { HomeLink } from "./_components/HomeLink";
import { NotFoundNav } from "./_components/NotFoundNav";

export const metadata: Metadata = { title: "Page not found" };

/** The 404 copy (a nod to Waterloo Region's ION light rail). */
const copy = {
  title: "404: Next station... not found.",
  body: "This one isn't on the ION route. Head home and get back on track.",
  home: "Head home",
  illustration: "A traveller who has wandered off the transit line",
};

const Page = styled.main`
  display: grid;
  place-items: center;
  min-height: 100dvh;
  padding: var(--space-7) var(--space-5);
  /* Light mode matches the illustration's taupe-50 ground, so the square melts into the page. */
  background: var(--illustration-page-bg);
  color: var(--color-text);
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  max-width: 32rem;
  text-align: center;
`;


const Title = styled.h1`
  margin: 0;
  font-size: var(--text-xl);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  letter-spacing: var(--tracking-tight);
`;

const Body = styled.p`
  margin: 0;
  font-size: var(--text-md);
  line-height: var(--leading-body);
  color: var(--color-text-muted);
`;


/**
 * The app's 404, for unknown URLs and `notFound()` anywhere without a closer not-found page.
 * The illustration is `public/illustrations/off-route.svg` (black line art on white), shown in brand taupe.
 */
export default function NotFound() {
  return (
    <Page>
      <NotFoundNav />
      <Content>
        <BrandIllustration src="/illustrations/off-route.svg" label={copy.illustration} />
        <Title>{copy.title}</Title>
        <Body>{copy.body}</Body>
        <HomeLink label={copy.home} />
      </Content>
    </Page>
  );
}
