import { Muted, Page, PageTitle } from "../automatic-emails/_components/parts";

/** Dummy members page: only shows the tag it was opened with, so "View members with this tag" has somewhere to go. */
export default async function MembersDesignPage({ searchParams }: PageProps<"/design/members">) {
  const params = await searchParams;
  const tag = Array.isArray(params.tag) ? params.tag[0] : params.tag;
  return (
    <Page>
      <PageTitle>Members</PageTitle>
      {tag ? <Muted>Filtered by tag: {tag}</Muted> : null}
    </Page>
  );
}
