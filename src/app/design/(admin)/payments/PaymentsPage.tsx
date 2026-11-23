"use client";

import * as React from "react";
import { styled } from "next-yak";
import { ReceiptText } from "lucide-react";
import { ListPage, ListPageHeader } from "@/components/patterns/ListPage";
import { PageLoading } from "@/components/patterns/PageLoading";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { AppToastProvider } from "@/components/ui/Toast";
import { BSF_SUPPORT_EMAIL } from "@/lib/contact";
import { EarnedCard, SourcesCard, TierEarnedCard } from "./Chart";
import { formatMoney, type Bucket, type Payment, type PaymentsData, type Person } from "./data";
import {
  DownloadButton,
  Figures,
  MatchDialog,
  PaymentSheet,
  PeriodPicker,
  Transactions,
  useLoadedOnce,
  usePaymentsView,
  useUndo,
  type PaymentsView,
} from "./parts";
import { TiersTab } from "./Tiers";
import { BlockFailed, labData, PageNotices, useRefreshing, useRetry, usePaymentsLab, type PaymentsLab } from "./states";

/*
 * An insights page with two jobs: hand finance a spreadsheet that ties out, and answer questions from
 * the board, funders or a member. One month range in the header drives all three tabs. To-dos (failed
 * or paused payments, unmatched money, unfinished approvals) live in Notifications, not here.
 *
 * What loads when (docs/backend/payments-insights.md): the page arrives with the open tab's numbers.
 * The chart, each tab (Radix mounts only the open one) and each page of transactions load when first
 * shown. The spreadsheet is built when asked for.
 */
/*
 * The period and download sit in the header's row. When the header is too narrow for both beside the title
 * (the header is a size container), they fill a row of their own, and stack on phones, so they share one right edge.
 */
const HeaderControls = styled.div`
  display: contents;

  @container (max-width: 640px) {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    width: 100cqi;

    & > * {
      flex: 1 1 auto;
    }
  }
`;

export function PaymentsPage({ data }: { data: PaymentsData }) {
  return (
    <AppToastProvider>
      {/* useSearchParams (the view state in the address) needs a Suspense boundary. */}
      <React.Suspense fallback={<PageLoading title="Payments" />}>
        <LabScreen data={data} />
      </React.Suspense>
    </AppToastProvider>
  );
}

/**
 * The page in whatever state the State lab (or, for real, the backend) puts it: the demo data each data state
 * stands for, then the page-wide states (no access, not found, couldn't load) before the screen itself.
 */
function LabScreen({ data }: { data: PaymentsData }) {
  const pl = usePaymentsLab();
  const { lab } = pl;
  // The flags that change the demo data. The screen starts over when they change, as it would on a new load.
  const dataKey = [lab.empty, lab.sectionEmpty, lab.singleItem, lab.manyItems, lab.partialData, lab.longText, lab.is("range-empty"), lab.is("no-tiers"), pl.partial].join();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const shown = React.useMemo(() => labData(data, lab), [data, dataKey]);
  const page = useRetry(pl.pageFailed);


  if (page.failed || page.retrying) {
    return page.retrying ? (
      <PageLoading title="Payments" />
    ) : (
      <ListPage>
        <ListPageHeader title="Payments" />
        <BlockFailed title="Couldn't load payments" description={`If it keeps happening, email ${BSF_SUPPORT_EMAIL}`} onRetry={page.retry} />
      </ListPage>
    );
  }
  return <Screen key={dataKey} data={shown} pl={pl} />;
}

function Screen({ data, pl }: { data: PaymentsData; pl: PaymentsLab }) {
  const view = usePaymentsView(data);
  const record = useUndo(pl.lab.undoExpired);
  // A new range reloads every region; what's on screen stays, marked busy, until it arrives.
  const refreshing = useRefreshing(`${view.current.from}:${view.current.to}`, pl.refreshFor);
  const [matching, setMatching] = React.useState<string | null>(null);
  const opened = view.payment ? (view.data.payments.find((p) => p.id === view.payment) ?? null) : null;

  function match(payment: Payment, person: Person) {
    const set = (personId: string | null) =>
      view.setData((d) => {
        const tierId = personId ? (d.people.find((x) => x.id === personId)?.tierId ?? null) : null;
        return { ...d, payments: d.payments.map((p) => (p.id === payment.id ? { ...p, personId, tierId } : p)) };
      });
    set(person.id);
    setMatching(null);
    const amount = formatMoney(payment.amount);
    record(`Matched ${amount} to ${person.name}`, `Unmatched ${amount} from ${person.name}`, () => set(null));
  }

  // A chart column opens Transactions for that day, month or year, and focus follows so keyboard users land there.
  const transactionsPanel = React.useRef<HTMLDivElement>(null);
  const focusPanel = React.useRef(false);
  // Only keyboard use paints a ring on the panel; a mouse click lands focus there quietly.
  const byKeyboard = React.useRef(false);
  React.useEffect(() => {
    const onKey = () => (byKeyboard.current = true);
    const onPointer = () => (byKeyboard.current = false);
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("pointerdown", onPointer, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("pointerdown", onPointer, true);
    };
  }, []);
  function pick(bucket: Bucket) {
    view.setBucket(bucket);
    focusPanel.current = true;
  }
  React.useEffect(() => {
    if (focusPanel.current && view.tab === "transactions") {
      focusPanel.current = false;
      const panel = transactionsPanel.current;
      requestAnimationFrame(() => {
        if (!panel) return;
        if (byKeyboard.current) panel.setAttribute("data-ring", "");
        else panel.removeAttribute("data-ring");
        panel.focus({ preventScroll: false });
      });
    }
  }, [view.tab]);

  const empty = view.data.payments.length === 0;
  const header = (
    <ListPageHeader
      title="Payments"
      actions={
        !empty && (
          <>
            <HeaderControls>
              <PeriodPicker view={view} pl={pl} />
              <DownloadButton view={view} pl={pl} />
            </HeaderControls>
          </>
        )
      }
    />
  );
  const notices = <PageNotices lab={pl.lab} today={view.data.today} />;

  if (empty) {
    return (
      <ListPage>
        {header}
        {notices}
        <EmptyState icon={ReceiptText} title="No payments yet" description="Payments show here once someone pays through a signup link" />
      </ListPage>
    );
  }

  return (
    <ListPage>
      {header}
      {notices}
      <Tabs value={view.tab} onValueChange={view.setTab}>
        <TabsList aria-label="Payments">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="tiers">Tiers</TabsTrigger>
        </TabsList>
        <Panel value="overview">
          <Overview view={view} pl={pl} refreshing={refreshing} onPick={pick} />
        </Panel>
        <Panel value="transactions" ref={transactionsPanel} tabIndex={-1}>
          <Transactions
            key={view.current.from + view.current.to}
            view={view}
            pl={pl}
            refreshing={refreshing}
            onOpen={(p) => (p.personId ? view.openPayment(p.id) : setMatching(p.id))}
          />
        </Panel>
        <Panel value="tiers">
          <TiersTab view={view} record={record} pl={pl} refreshing={refreshing} />
        </Panel>
      </Tabs>
      <MatchDialog key={matching ?? "none"} view={view} pl={pl} paymentId={matching} onClose={() => setMatching(null)} onMatched={match} />
      <PaymentSheet view={view} payment={opened} onClose={view.closePayment} />
    </ListPage>
  );
}

/* The kit pads a tab panel by --space-5; under tabs that sit right on a table, one step is enough. */
const Panel = styled(TabsContent)`
  padding-top: var(--space-4);

  &:not([data-ring]):focus-visible {
    box-shadow: none;
  }
`;

const OverviewSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-width: 0;
  /* The chart grid below sizes its columns by this section's width (a container can't query itself). */
  container-type: inline-size;
`;

/* Earned and Monthly income full width; the two breakdowns share a row when there's room. */
const ChartGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-4);
  min-width: 0;

  /* Earned by tier and Raised by signup link sit side by side once the content is 1024px wide; below that they stack. */
  @container (min-width: 1024px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

/** Number cards, then chart cards. Each chart loads on its own the first time it's shown for a range. */
function Overview({ view, pl, refreshing, onPick }: { view: PaymentsView; pl: PaymentsLab; refreshing: boolean; onPick: (bucket: Bucket) => void }) {
  const ready = useLoadedOnce(`chart:${view.current.from}:${view.current.to}`) && !pl.loading;
  const charts = { data: view.data, period: view.period, current: view.current, ready, pl, refreshing };
  // An organisation with no tiers or no signup links has nothing to chart there: that card isn't drawn at all.
  const showTiers = view.data.tiers.length > 0;
  const showLinks = view.data.sources.length > 0;
  return (
    <OverviewSection aria-label="Overview">
      <Figures view={view} pl={pl} refreshing={refreshing} />
      <ChartGrid>
        <EarnedCard {...charts} onPick={onPick} />
        {showTiers && <TierEarnedCard {...charts} wide={!showLinks} />}
        {showLinks && <SourcesCard {...charts} wide={!showTiers} />}
      </ChartGrid>
    </OverviewSection>
  );
}
