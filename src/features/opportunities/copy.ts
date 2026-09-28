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
    searchPlaceholder: "Search by title or organization",
    /** Column filter names: "Filter Type", "Show type". */
    typeLabel: "Type",
    organizationLabel: "Organization",
  },
  table: {
    caption: "Opportunities",
    opportunity: "Opportunity",
    type: "Type",
    organization: "Organization",
    date: "Date",
    /** NEW, NEEDS APPROVAL: header and cells ("Created today", "Edited 3d ago"). */
    lastChange: "Last change",
    created: (when: string) => `Created ${when}`,
    edited: (when: string) => `Edited ${when}`,
  },
  empty: {
    published: { title: "Nothing published right now", body: "Publish an opportunity and it will show up here." },
    drafts: { title: "No drafts", body: "Drafts you save show up here. Only people who can edit see them." },
    closed: { title: "Nothing closed yet", body: "Opportunities move here when their date passes or someone closes them." },
    noResults: { title: "No matches", body: "Try a different search or clear the filters.", clear: "Clear filters" },
  },
  panel: {
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
    /** Three steps on one page (decision 17). NEW, NEEDS APPROVAL: step names and Back/Next. */
    steps: { type: "Type", details: "Details", review: "Review" },
    stepsLabel: "Steps",
    stepDone: "done",
    next: "Next",
    previous: "Back",
    /** The first field. Editable on new listings and drafts; plain text once published or closed. */
    kind: { label: "Type" },
    /**
     * One muted line under Type describing the selected type.
     * NEEDS OWNER APPROVAL: proposed copy, not yet confirmed by the owner.
     */
    kindDescription: {
      event: "People attend at a set time.",
      petition: "People add their name to support a cause.",
      volunteer: "People give their time to help.",
      job: "A paid position.",
      other: "Anything else, like a survey or a program.",
    },
    /** Placeholder for pickers with nothing chosen yet (organization, employment type, area). */
    choose: "Choose one",
    sections: {
      basics: "Basics",
      event: "Date and place",
      petition: "Petition details",
      volunteer: "Role details",
      job: "Job details",
      other: "Details",
    },
    /** Events only, the first field after Type (decision 18). NEW, NEEDS APPROVAL: label, hint and button. */
    eventbrite: {
      label: "Eventbrite link (optional)",
      hint: "We copy the title, description, date, time and place from it. You can change them after.",
      fill: "Fill in details",
    },
    /** Hints only where they prevent a mistake (decision 22). */
    organization: { label: "Organization" },
    title: { label: "Title" },
    summary: { label: "Short description", hint: "One or two sentences for the email. Full details stay on your page." },
    topics: {
      label: "Topics",
      /** NEW, NEEDS APPROVAL. Beside the label. */
      count: (n: number, max: number) => `${n} of ${max} selected`,
      /** Owner's words (27 Sep): the disabled reason on unselected topics at the cap. */
      capReason: "You can choose up to 3 topics. Unselect one to choose another.",
    },
    link: {
      label: "Link",
      hint: {
        event: "Where people register, like your Eventbrite or Luma page.",
        petition: "Where people sign the petition.",
        volunteer: "Where people sign up to volunteer.",
        job: "Where people apply.",
        other: "Where people take part.",
      },
    },
    /** Structured place for matching (decision 19). NEW, NEEDS APPROVAL. */
    area: { label: "Area" },
    address: { label: "Address or venue" },
    event: {
      date: "Date",
      startTime: "Start time",
      endTime: "End time",
      format: "How people attend",
      cost: "Cost",
      free: "Free",
      paid: "Paid",
      costDetails: { label: "Cost details" },
      /** NEW, NEEDS APPROVAL: checkbox group and note labels. */
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
      /** NEW, NEEDS APPROVAL: now a choice, not free text. */
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
    /** Step 3: the email preview (decision 17). NEW, NEEDS APPROVAL. */
    review: {
      intro: "This is how the listing looks in members' emails.",
      previewLabel: "Email preview",
      postedBy: (org: string) => `From ${org}`,
      noTitle: "No title yet",
      noSummary: "No description yet",
      noTopics: "No topics yet",
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
