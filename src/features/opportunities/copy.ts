/**
 * Every user-facing string for Opportunities, in both portals. Kind and topic labels live in catalog.ts;
 * validation and result messages live in service.ts. The UX copy review happens in docs/ux/.
 */
export const copy = {
  page: {
    title: "Opportunities",
    newButton: "New opportunity",
  },
  tabs: { published: "Published", drafts: "Drafts", closed: "Closed" },
  toolbar: {
    searchLabel: "Search opportunities",
    /** Partners only see their own organization's listings, so their search is by title only. */
    searchPlaceholder: { admin: "Search by title or organization", partner: "Search by title" },
    /** Column filter names: "Filter Type", "Show type". */
    typeLabel: "Type",
    organizationLabel: "Organization",
  },
  table: {
    opportunity: "Opportunity",
    type: "Type",
    organization: "Organization",
    /** One column for the event date, deadline or apply-by date, with the same wording for every type. */
    date: "Closes",
    noCloseDate: "No end date",
    /** Email reach columns. */
    sentTo: "Sent to",
    clicks: "Clicks",
    notSent: "Not sent yet",
    openRow: "Open details",
    /** Header and cells ("Created today", "Edited 3d ago"). */
    lastChange: "Last change",
    created: (when: string) => `Created ${when}`,
    edited: (when: string) => `Edited ${when}`,
  },
  /** The partner portal's opportunity cards. */
  cards: {
    untitled: "Untitled",
    closes: (when: string) => `Closes ${when}`,
    reach: (sent: string, clicks: string) => `Sent to ${sent} · ${clicks} clicks`,
  },
  empty: {
    published: { title: "Nothing published right now", body: "Publish an opportunity and it will show up here." },
    drafts: { title: "No drafts", body: "Drafts you save show up here. Only people who can edit see them." },
    closed: { title: "Nothing closed yet", body: "Opportunities move here when their date passes or someone closes them." },
    noResults: { title: "No matches", body: "Try a different search or clear the filters.", clear: "Clear filters" },
  },
  panel: {
    /** Reach tiles, the "soon but not sent" warning and the details heading. */
    sentTo: "Sent to",
    clicks: "Clicks",
    people: (n: string) => `${n} people`,
    /** Read after the click rate by screen readers only; the rate shows beside the count. */
    clickRateOf: "of people it was sent to",
    notSentYet: "Not sent yet",
    soonNotSent: (days: number) =>
      days <= 0 ? "Happening today and not emailed to anyone yet." : `In ${days} ${days === 1 ? "day" : "days"} and not emailed to anyone yet.`,
    whenIn: (days: number) => (days === 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`),
    when: "When",
    tagsLabel: "Status, type and topics",
    details: "Details",
    edit: "Edit",
    moreActions: "More actions",
    openLink: "Open link",
    duplicate: "Duplicate",
    close: "Close",
    reopen: "Reopen",
    delete: "Delete",
    postedBy: "Posted by",
    topics: "Topics",
    link: "Link",
    lastUpdated: (when: string, who: string) => `Updated ${when} by ${who}`,
    statusPublished: "Published",
    statusDraft: "Draft",
    statusClosed: "Closed",
    /** Why a listing is closed; shown beside the Closed status. */
    closedReason: { ended: "Ended", closed: "Closed", partner_removed: "Partner access removed" },
    noDescription: "No description yet.",
    notSet: "Not set",
  },
  confirmDelete: {
    title: (noun: string) => `Delete this ${noun}?`,
    body: "It will be removed for everyone and can't be restored. To stop recommending and emailing it but keep the record, close it instead.",
    confirm: "Delete",
    cancel: "Cancel",
  },
  form: {
    newTitle: (noun: string) => `New ${noun}`,
    editTitle: (noun: string) => `Edit ${noun}`,
    back: "Opportunities",
    publish: "Publish",
    saveChanges: "Save changes",
    saveDraft: "Save as draft",
    cancel: "Cancel",
    /** Three steps on one page. step names and Back/Next. */
    steps: { type: "Type", details: "Details", review: "Review" },
    stepsLabel: "Steps",
    stepDone: "done",
    next: "Next",
    previous: "Back",
    /** The first field. Editable on new listings and drafts; plain text once published or closed. */
    kind: { label: "Type" },
    /** Placeholder for pickers with nothing chosen yet (organization, employment type, area). */
    choose: "Choose one",
    sections: {
      /** The Details step after an Eventbrite fill. */
      fromEventbrite: "From Eventbrite",
      fromYou: "Add the rest",
      basics: "Basics",
      event: "Date and place",
      petition: "Petition details",
      volunteer: "Role details",
      job: "Job details",
      other: "Details",
    },
    /** Events only, the first field after Type. label, hint and button. */
    eventbrite: {
      found: "This is an Eventbrite page",
      hint: "We can fill in the title, description, date, time and place from it. You can change them after.",
      fill: "Fill in details",
      /** Shown when Eventbrite is too slow to answer. */
      timedOut: "Timed out. Couldn't fetch details from Eventbrite.",
    },
    /** Unsaved work kept in the browser. */
    draft: {
      restored: (when?: string) => (when ? `We restored your unsaved changes from ${when}.` : "We restored your unsaved changes."),
      discard: "Discard",
    },
    /** The listing's image. */
    image: {
      label: "Image",
      add: "Add an image",
      dropHint: "Click or drag one here. Wide JPG, PNG or WebP works best.",
      replace: "Replace",
      remove: "Remove",
      previewAlt: "The listing's image",
      wrongType: "Choose a JPG, PNG or WebP image.",
      unreadable: "We couldn't read that image. Try another JPG, PNG or WebP file.",
      tooWide: "This image is too wide to show well. Choose one no more than 8 times wider than it is tall.",
      tooTall: "This image is too tall to show well. Choose one no more than 8 times taller than it is wide.",
    },
    /** Hints only where they prevent a mistake. */
    organization: { label: "Organization" },
    title: { label: "Title" },
    summary: { label: "Short description", hint: "One or two sentences for the email." },
    topics: {
      label: "Topics",
      /** Beside the label. */
      count: (n: number, max: number) => `${n} of ${max} selected`,
      /** The disabled reason on unselected topics at the cap. */
      capReason: "You can choose up to 3 topics. Unselect one to choose another.",
    },
    /**
     * Required for every type: a click is how we know an email worked. Volunteer roles and jobs may
     * only have an email, so those accept one.
     */
    link: {
      label: {
        event: "Link",
        petition: "Link",
        volunteer: "Link or email",
        job: "Link or email",
        other: "Link",
      },
      hint: {
        event: "Where people register, like an Eventbrite or Luma page.",
        petition: "Where people sign the petition.",
        volunteer: "Where people sign up: a web page or an email address.",
        job: "Where people apply: a web page or an email address.",
        other: "Where people take part.",
      },
    },
    /** Structured place for matching. */
    area: { label: "Area" },
    event: {
      date: "Date",
      startTime: "Start time",
      endTime: "End time",
      format: "How people attend",
      cost: "Cost",
      free: "Free",
      paid: "Paid",
      /** A price or a range instead of free text. */
      priceMin: { label: "From ($)" },
      priceMax: { label: "To ($)" },
      price: "Price",
      /** Checkbox group and note labels. */
      accessibility: { label: "Accessibility" },
      accessibilityNote: { label: "Accessibility note" },
    },
    petition: {
      target: { label: "Addressed to" },
      deadline: { label: "Deadline", hint: "It closes after this day." },
      signatureGoal: { label: "Signature goal" },
    },
    volunteer: {
      format: "Where volunteers work",
      startDate: { label: "Start date" },
      /** Now a choice, not free text. */
      timeCommitment: { label: "Time commitment" },
      skills: { label: "Skills" },
      minimumAge: { label: "Minimum age" },
      applyBy: { label: "Apply by", hint: "It closes after this day." },
    },
    job: {
      employmentType: "Employment type",
      workplace: "Workplace",
      pay: { label: "Pay" },
      applyBy: { label: "Apply by", hint: "It closes after this day." },
      qualifications: { label: "Qualifications" },
    },
    other: {
      callToAction: { label: "Call to action", hint: "The button people see, for example “Take the survey”." },
      deadline: { label: "Deadline", hint: "It closes after this day." },
      details: { label: "Details" },
      detailLabel: "Label",
      detailValue: "Value",
      addDetail: "Add detail",
      removeDetail: (n: number) => `Remove detail ${n}`,
    },
    /** Step 3: the email preview. */
    review: {
      previewLabel: "Email preview",
      /** The preview's host line and the email's share button. */
      hostedBy: (org: string) => `Hosted by ${org}`,
      share: "Send to a friend",
      noTitle: "No title yet",
      noSummary: "No description yet",
      editType: "Edit type and link",
      editDetails: "Edit details",
      /** The email's button when a type has no call to action of its own. */
      cta: {
        event: "Register",
        petition: "Sign the petition",
        volunteer: "Sign up to volunteer",
        job: "Apply",
        other: "Learn more",
      },
    },
  },
  /** Admin Organization filter label for a removed partner. It names the organization, not a listing status. */
  removedPartnerFilterOption: (name: string) => `${name} (removed)`,
  notFound: {
    title: "Opportunity not found",
    body: "It may have been deleted, or it belongs to another organization.",
    back: "Back to opportunities",
  },
} as const;
