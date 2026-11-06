import { AutomaticEmails } from "./_components/AutomaticEmails";

/** Justin's automatic emails prototype on the kit. `?empty` and `?failSaves` switch on its test scenarios. */
export default async function AutomaticEmailsDesignPage({ searchParams }: PageProps<"/design/automatic-emails">) {
  const params = await searchParams;
  return <AutomaticEmails empty={"empty" in params} failSaves={"failSaves" in params} />;
}
