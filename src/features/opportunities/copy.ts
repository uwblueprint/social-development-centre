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
    organization: "Organization",
    date: "Date",
    updated: "Updated",
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
    /** Placeholder for pickers with nothing chosen yet (organization, employment type). */
    choose: "Choose one",
    sections: {
      basics: "Basics",
      event: "Date and place",
      petition: "Petition details",
      volunteer: "Role details",
      job: "Job details",
      other: "Details",
    },
    organization: { label: "Organization", hint: "Post as SDC, or on behalf of a partner." },
    title: { label: "Title", hint: "Say what it is in a few words. This is the email headline." },
    summary: { label: "Short description", hint: "One or two sentences for the email. Full details stay on your page." },
    topics: { label: "Topics", hint: "Choose up to 3. We send it to people who care about these." },
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
    event: {
      date: "Date",
      startTime: "Start time",
      endTime: "End time",
      format: "How people attend",
      location: { label: "Location", hint: "Address or venue name." },
      cost: "Cost",
      free: "Free",
      paid: "Paid",
      costDetails: { label: "Cost details", hint: "For example, “$10, pay what you can”." },
      accessibility: { label: "Accessibility", hint: "Step-free access, ASL, childcare, quiet space. Leave blank if you're not sure." },
    },
    petition: {
      target: { label: "Addressed to", hint: "Who you're asking, for example “Region of Waterloo Council”." },
      deadline: { label: "Deadline", hint: "Optional. It closes after this day." },
      signatureGoal: { label: "Signature goal", hint: "Optional." },
    },
    volunteer: {
      commitment: "Commitment",
      format: "Where volunteers work",
      location: { label: "Location", hint: "Address or neighbourhood." },
      startDate: { label: "Start date", hint: "Optional." },
      timeCommitment: { label: "Time commitment", hint: "For example, “2 hours a week”." },
      skills: { label: "Skills or experience", hint: "Optional. Leave blank if anyone can help." },
      minimumAge: { label: "Minimum age", hint: "Optional." },
      applyBy: { label: "Apply by", hint: "Optional. It closes after this day." },
    },
    job: {
      employmentType: "Employment type",
      workplace: "Workplace",
      location: { label: "Location", hint: "City or address." },
      pay: { label: "Pay", hint: "For example, “$22–25 an hour”. Including pay gets more applicants." },
      applyBy: { label: "Apply by", hint: "Optional. It closes after this day." },
      qualifications: { label: "Qualifications", hint: "Optional. Must-haves only." },
    },
    other: {
      callToAction: { label: "Call to action", hint: "The button people see, for example “Take the survey”." },
      deadline: { label: "Deadline", hint: "Optional. It closes after this day." },
      details: { label: "Details", hint: "Optional. Add up to 5, like “Time needed: 5 minutes”." },
      detailLabel: "Label",
      detailValue: "Value",
      addDetail: "Add detail",
      removeDetail: (n: number) => `Remove detail ${n}`,
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
