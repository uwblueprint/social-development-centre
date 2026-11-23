import { css, styled } from "next-yak";
import { BrandIllustration } from "./BrandIllustration";
import { HomeLink } from "./HomeLink";
import { NotFoundNav } from "./NotFoundNav";

export const notFoundTitle = "Page not found";

/** The owner's 404 copy (Waterloo Region's ION light rail). */
const copy = {
  title: "404: Next station... not found.",
  body: "This one isn't on the ION route. Head home and get back on track.",
  home: "Head home",
  illustration: "A traveller who has wandered off the transit line",
};

const page = css`
  display: grid;
  place-items: center;
  padding: var(--space-7) var(--space-5);
  /* Light mode matches the illustration's taupe-50 ground, so the square melts into the page. */
  background: var(--illustration-page-bg);
  color: var(--color-text);
`;

/** On its own, the 404 is the page's only landmark and fills the window. */
const Page = styled.main`
  ${page}
  min-height: 100dvh;
`;

/** Inside a sidebar layout, which already provides the <main>: fill the content area instead. */
const ShellPage = styled.div`
  ${page}
  min-height: 100%;
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
 * `inShell` is for portals with a sidebar (admin, design admin screens): the sidebar's <main> wraps it,
 * so it must not add a second one. The illustration is `public/illustrations/off-route.svg`, in brand taupe.
 */
export function NotFoundScreen({ inShell = false }: { inShell?: boolean }) {
  const Root = inShell ? ShellPage : Page;
  return (
    <Root>
      <NotFoundNav />
      <Content>
        <BrandIllustration src="/illustrations/off-route.svg" label={copy.illustration} />
        <Title>{copy.title}</Title>
        <Body>{copy.body}</Body>
        <HomeLink label={copy.home} />
      </Content>
    </Root>
  );
}
