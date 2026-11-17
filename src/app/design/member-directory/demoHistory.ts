/*
 * Text banks and generators for the member directory demo data: names, intake answers, events and the emails SDC sends.
 * Pure strings and numbers, no imports, so data.ts can build realistic histories from it at module load.
 */

/** Small seeded PRNG so server and client render the same people. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- people ---------- */

export const FIRST_NAMES = [
  "Aaliyah", "Abdi", "Adaeze", "Aisha", "Alex", "Amara", "Amir", "Ananya", "Andre", "Anita", "Arjun", "Beatriz", "Ben", "Camille", "Carlos",
  "Chidi", "Chloe", "Daniel", "Darius", "Deepa", "Diego", "Elena", "Eli", "Emma", "Eun-ji", "Farah", "Fatima", "Gabriel", "Grace", "Hana",
  "Hassan", "Ingrid", "Isaac", "Jamal", "Jasmine", "Jean", "Jelena", "Jin", "Joanne", "Kareem", "Katarzyna", "Kofi", "Lakshmi", "Laura",
  "Liam", "Lina", "Luca", "Maria", "Marcus", "Maya", "Mei", "Mohamed", "Nadia", "Naomi", "Nikhil", "Olivia", "Omar", "Paolo", "Pooja",
  "Rachel", "Rafael", "Ravi", "Rosa", "Ruth", "Samira", "Sarah", "Sofia", "Stefan", "Sunita", "Tariq", "Thanh", "Theo", "Tomasz", "Uzma",
  "Valerie", "Victor", "Wei", "Yasmin", "Yusuf", "Zainab", "Zoe", "Karen", "Peter", "Ashley", "Michael", "Linda", "Owen", "Hannah", "Noor",
];

export const LAST_NAMES = [
  "Abbasi", "Adeyemi", "Ahmed", "Alvarez", "Anderson", "Bauman", "Bell", "Bergeron", "Bhatt", "Brubacher", "Campbell", "Chan", "Chowdhury",
  "Costa", "Cruz", "Dang", "Das", "Diaz", "Dyck", "Eby", "Fernandes", "Friesen", "Gagnon", "Gill", "Gonzalez", "Hall", "Haddad", "Hoffman",
  "Hussein", "Ibrahim", "Ivanov", "Jackson", "Jarvis", "Jung", "Kaur", "Khan", "Kim", "Kovacs", "Kumar", "Lam", "Lavoie", "Leblanc", "Li",
  "MacDonald", "Martin", "Mensah", "Moore", "Morrison", "Mwangi", "Nguyen", "Nowak", "Okafor", "Oliveira", "Ortiz", "Osei", "Papadakis",
  "Patel", "Pereira", "Phillips", "Quinn", "Rahman", "Ramos", "Reid", "Rossi", "Sahota", "Santos", "Schmidt", "Shantz", "Sharma", "Singh",
  "Snyder", "Soltani", "Stewart", "Sutherland", "Tanaka", "Taylor", "Thomas", "Tran", "Vasquez", "Wagner", "Walker", "Weber", "Wong", "Yilmaz",
  "Young", "Zhang", "Ziegler", "Bowman", "Cooper", "Dhillon", "Fraser", "Gauthier", "Horst", "Kalinowski", "Lopes", "Nair", "Roy", "Wilson",
];

export const STREETS = [
  "King St W", "University Ave E", "Weber St N", "Victoria St S", "Fischer-Hallman Rd", "Erb St W", "Ottawa St N", "Hespeler Rd", "Queen St N",
  "Highland Rd W", "Westmount Rd", "Franklin Blvd", "Dundas St", "Water St N", "Coronation Blvd", "Lancaster St W", "Bridgeport Rd", "Columbia St W",
];

/** Intake form's location choices (exact labels) with the town a street address would be in, and how common each is. */
export const PLACES: { location: string; town: string; weight: number }[] = [
  { location: "Kitchener", town: "Kitchener", weight: 34 },
  { location: "Waterloo", town: "Waterloo", weight: 26 },
  { location: "Cambridge", town: "Cambridge", weight: 18 },
  { location: "Woolwich", town: "Elmira", weight: 7 },
  { location: "Wilmot", town: "New Hamburg", weight: 5 },
  { location: "Wellesley", town: "Wellesley", weight: 3 },
  { location: "North Dumfries", town: "Ayr", weight: 3 },
  { location: "Outside Waterloo Region", town: "Guelph", weight: 4 },
];

/* ---------- intake form answers: the exact labels from the Ride for Refuge form (src/features/intake/copy.ts) ---------- */

export const INTAKE_TOPICS = [
  "Housing, tenant rights, and eviction prevention",
  "Homelessness, encampments, and ending chronic homelessness",
  "Climate resilience, environmental justice, and community-led climate action",
  "Lived expertise and community-led policy change",
  "Grassroots groups, community organizing, and the Civic Hub",
  "Neighbourhood connections and community-building",
  "Research, policy, and social justice",
  "Arts-based approaches to civic and community engagement",
];
export const INTAKE_TOPIC_OTHERS = ["Food security", "Transit and getting around", "Youth programs", "Newcomer settlement", "Seniors and isolation"];

export const INTAKE_WAYS = [
  "Receive invitations to occasional workshops, discussions, or community events",
  "Be contacted about opportunities to share my knowledge, skills, or lived experience",
  "Receive invitations to participate in campaigns or community actions",
  "For now, I'd prefer to just stay informed about SDC's work on local issues",
];
export const INTAKE_WAY_OTHERS = ["Help with photography at events", "Introduce SDC to my congregation", "Translate materials into Portuguese"];

export const INTAKE_TIMES = [
  "A few minutes for a quick action",
  "A few hours for an event or activity",
  "I’m open to an ongoing volunteer role",
  "It depends on the opportunity",
  "I just want to stay informed for now",
];

export const INTAKE_HOPES = [
  "I'd like to meet neighbours who care about housing, and help out at events where I can.",
  "Learning what's actually happening in the region, not just the headlines.",
  "I rode for my sister, who spent two winters without a place of her own. I want to keep showing up.",
  "A way to turn caring into something practical.",
  "Short, honest updates. I don't have much time but I want to stay connected.",
  "I'm a renter and I've seen how fast rents are climbing. I'd like to learn what can be done about it.",
  "Meeting other people in Cambridge who are working on this.",
  "To feel less alone about how bad things are getting, and to find something useful to do.",
  "I work in health care and see the effects every day. Happy to share what I know.",
  "Ideas for how to get my workplace involved.",
  "Hearing from people with lived experience, and not only from the experts.",
  "I'm new to the area and want to get to know it through people doing good work.",
  "More ways for students to help out.",
  "Seeing real change in my neighbourhood.",
];

export const NOTE_TEXTS = [
  "Prefers phone calls to email. Best before noon.",
  "Came with her neighbour. Said she'd like to help with the lunches in the new year.",
  "Asked about a receipt for taxes. Sent it on the same day.",
  "Works shifts, so evening events are hard. Daytime volunteering suits better.",
  "Runs a small shop on Weber St. Might host a poster.",
  "Asked not to be added to the volunteer list for now.",
  "Wants updates on tenant rights workshops in particular.",
  "Member of a local congregation that supports SDC. Introduced two other members.",
  "Spoke well at the forum. Worth asking again about the speakers' list.",
  "Has mobility needs. Check the venue is step-free before inviting.",
];

/* ---------- events: the same ones for everyone, so invitations line up across members ---------- */

export interface DemoEvent {
  name: string;
  date: string;
  place: string;
  blurb: string;
  /** SDC asks members for volunteers for these. */
  ask?: boolean;
}

const EVENT_TEMPLATES: { name: string; md: string; place: string; blurb: string; ask?: boolean }[] = [
  { name: "Community lunch", md: "02-18", place: "the Civic Hub", blurb: "Come for a free meal and a good conversation with neighbours." },
  { name: "Tenant rights workshop", md: "03-12", place: "the Civic Hub", blurb: "A volunteer lawyer will explain your rights as a renter and answer questions." },
  { name: "Volunteer orientation", md: "04-23", place: "online", blurb: "A short session on how volunteering at SDC works and where help is needed." },
  { name: "Community lunch", md: "06-17", place: "the Civic Hub", blurb: "Come for a free meal and a good conversation with neighbours.", ask: true },
  { name: "Summer picnic", md: "07-15", place: "Victoria Park", blurb: "Bring a blanket and something to share. We'll bring the games." },
  { name: "Community lunch", md: "09-16", place: "the Civic Hub", blurb: "Come for a free meal and a good conversation with neighbours." },
  { name: "Housing forum", md: "10-07", place: "Kitchener City Hall", blurb: "Neighbours, tenants and city staff talk about what housing should look like here.", ask: true },
  { name: "Fall workshop", md: "10-16", place: "the Civic Hub", blurb: "A hands-on evening about organizing in your own neighbourhood." },
  { name: "Ride for Refuge", md: "10-18", place: "Victoria Park", blurb: "Our yearly ride to raise money and awareness for people without a home.", ask: true },
  { name: "Winter warm-up", md: "12-02", place: "the Civic Hub", blurb: "Hot soup, warm clothes to swap, and a chance to meet the people behind our winter work." },
];

export const DEMO_EVENTS: DemoEvent[] = [];
for (let y = 2020; y <= 2026; y++) {
  for (const t of EVENT_TEMPLATES) DEMO_EVENTS.push({ name: t.name, date: `${y}-${t.md}`, place: t.place, blurb: t.blurb, ask: t.ask });
}
DEMO_EVENTS.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

/* ---------- emails ---------- */

export interface Mail {
  title: string;
  body: string;
}

const MONTH_TOPICS: { s: string; t: string }[] = [
  { s: "housing forum recap", t: "It was good to see so many of you at the housing forum. We've put a short recap online of what neighbours asked the city to do, and what happens next." },
  { s: "what we heard at the lunch", t: "At the last community lunch we heard a lot about rent increases and how hard it is to find a one-bedroom. We've pulled those stories together for a letter to regional council." },
  { s: "tenant rights clinic dates", t: "Our tenant rights clinics are back. Volunteer lawyers will be at the Civic Hub on a few evenings this season, and you can book a time by replying to this email." },
  { s: "new ways to volunteer", t: "We have some new volunteer roles that take an hour or two at a time, from greeting people at lunches to helping with our phone tree." },
  { s: "planning for winter", t: "Winter is when the need is greatest. Here's what we're planning for warm spaces, and where we could use another pair of hands." },
  { s: "our note to regional council", t: "This month we sent a letter to regional council about eviction prevention. You can read it on our website, and we've included a few lines you can use if you'd like to write too." },
  { s: "inside the Civic Hub", t: "Grassroots groups meet at the Civic Hub all month. Here's who is using the space, and how your group could book it." },
  { s: "stories from your neighbours", t: "Three members told us why they got involved. Their stories are short and worth a read." },
  { s: "summer picnic and what's next", t: "Thank you to everyone who came out to the picnic. Here are a few photos, and a look at what we're working on this fall." },
  { s: "back to school, back to work", t: "September is busy for everyone. We kept this update short: three dates, one ask, and one good news story." },
  { s: "a year in numbers", t: "We looked back at what your memberships made possible this year: lunches served, calls answered, and letters sent. The numbers are better than we expected." },
  { s: "spring events and a new report", t: "A new report on housing costs in the region is out, and we have a full set of spring events lined up." },
  { s: "eviction numbers are up", t: "New figures show more eviction notices across Waterloo Region than last year. We explain what it means and what tenants can do." },
  { s: "reading the budget together", t: "The regional budget is hard to read. We're holding a short session to go through it line by line, and we've put the main points below." },
  { s: "climate and housing together", t: "Heat waves hit people without good housing the hardest. This month we look at how climate planning and housing work fit together." },
  { s: "how your neighbours are organizing", t: "A tenants' group in Cambridge won repairs after months of organizing. Here's how they did it, and how we can help your building do the same." },
];
const MONTH_CLOSERS = [
  "Reply any time if you'd like to help. We read every message.",
  "Everything on our events page is free for members.",
  "If a month feels busy, just read along. That counts too.",
  "Thanks for being part of this.",
];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** The monthly update is the same for everyone in a given month, with the person's first name on top. */
export function monthlyMail(first: string, year: number, month0: number): Mail {
  const n = year * 12 + month0;
  const topic = MONTH_TOPICS[n % MONTH_TOPICS.length];
  return {
    title: `${MONTHS[month0]} at SDC: ${topic.s}`,
    body: `Hi ${first},\n\n${topic.t}\n\n${MONTH_CLOSERS[(n >> 1) % MONTH_CLOSERS.length]}\n\nThe SDC team`,
  };
}

export function welcomeMail(first: string, v: number): Mail {
  const bodies = [
    `Hi ${first},\n\nWelcome to the Social Development Centre. You're now part of a community that shows up for Waterloo Region.\n\nWe'll send you a short note each month with ways to get involved.\n\nThe SDC team`,
    `Hi ${first},\n\nThank you for joining SDC. Your membership helps us keep community lunches free and keep pushing for housing people can afford.\n\nYou'll hear from us about once a month. If you ever want to talk, just reply to this email.\n\nThe SDC team`,
    `Hi ${first},\n\nWe're so glad you're here. Over the next few weeks we'll share the events members say they enjoy most, and ways to take part at your own pace.\n\nThe SDC team`,
  ];
  return { title: `Welcome to SDC, ${first}`, body: bodies[v % bodies.length] };
}

export function welcomeBackMail(first: string): Mail {
  return {
    title: `Welcome back, ${first}`,
    body: `Hi ${first},\n\nIt's good to have you back. Your membership is active again, and you'll get the monthly update starting this month.\n\nIf anything has changed since you were last with us, such as your address or email, just reply and let us know.\n\nSuhanya`,
  };
}

export function receiptMail(first: string, amount: string, date: string, v: number): Mail {
  const bodies = [
    `Hi ${first},\n\nThank you for your payment of ${amount} on ${date}. This is your receipt for your yearly SDC membership.\n\nNothing else is needed from you. Your membership renews automatically each year, and you can reply to this email any time to change or cancel it.\n\nThe SDC team`,
    `Hi ${first},\n\nWe received your payment of ${amount} on ${date}. Thank you! Please keep this email as your receipt.\n\nYour membership will renew by itself next year, and we'll send a reminder first.\n\nThe SDC team`,
  ];
  return { title: "Your SDC membership receipt", body: bodies[v % bodies.length] };
}

export function thanksMail(first: string, years: number, v: number): Mail {
  const length = years === 1 ? "a full year" : `${years} years`;
  const bodies = [
    `Hi ${first},\n\nYou've now been with SDC for ${length}. That steadiness is what lets us plan ahead, and we don't take it for granted.\n\nWe hope to see you at the next lunch.\n\nSuhanya`,
    `Hi ${first},\n\nThank you for renewing your membership. Members like you are why we can say yes when neighbours ask for help.\n\nThe SDC team`,
    `Hi ${first},\n\nYour membership has renewed for another year. After ${length} with us, you've seen a lot of what we do, and we'd love to hear what you'd like more of.\n\nJust reply to this email.\n\nSuhanya`,
  ];
  return { title: years === 1 ? `Thank you for renewing, ${first}` : `Thank you for another year, ${first}`, body: bodies[v % bodies.length] };
}

export function renewalReminderMail(first: string, amount: string, date: string): Mail {
  return {
    title: `Your membership renews on ${date}`,
    body: `Hi ${first},\n\nA quick note that your SDC membership will renew on ${date} for ${amount}. You don't need to do anything.\n\nIf you'd like to change your amount or pause for a year, just reply to this email.\n\nThe SDC team`,
  };
}

export function endedMail(first: string, date: string): Mail {
  return {
    title: "Your SDC membership has ended",
    body: `Hi ${first},\n\nYour SDC membership ended on ${date}. Thank you for everything you gave during your time with us.\n\nIf you'd like to come back, you can rejoin any time on our website.\n\nThe SDC team`,
  };
}

export function comeBackMail(first: string): Mail {
  return {
    title: "We'd love to have you back",
    body: `Hi ${first},\n\nWe've missed seeing you at SDC. If the timing was the problem, that's okay. You're welcome back whenever it suits you, and a new membership starts the day you rejoin.\n\nSuhanya`,
  };
}

export function agmMail(first: string, year: number, v: number): Mail {
  const bodies = [
    `Hi ${first},\n\nSDC's annual general meeting is coming up in November. Members can vote for the board and see how last year's money was spent.\n\nThe agenda and the annual report will be on our website two weeks before. We hope to see you there.\n\nThe SDC team`,
    `Hi ${first},\n\nThis is your notice for our ${year} annual general meeting, in the second week of November. You can join in person or online.\n\nIf you can't make it, you can still send questions ahead by replying to this email.\n\nThe SDC team`,
  ];
  return { title: `Notice: SDC annual general meeting ${year}`, body: bodies[v % bodies.length] };
}

export function annualReportMail(first: string): Mail {
  return {
    title: "Our annual report is out",
    body: `Hi ${first},\n\nOur annual report is ready. It's short, and it has the numbers, a few stories and some photos from the lunches.\n\nIf anything surprises you, reply and tell me.\n\nThe SDC team`,
  };
}

const TIPS = ["Doors open half an hour early.", "Wear something comfortable.", "Tea and coffee will be ready.", "It's step-free and close to the bus."];

export function inviteMail(first: string, e: DemoEvent, when: string, v: number): Mail {
  const where = e.place === "online" ? "online" : `at ${e.place}`;
  const bodies = [
    `Hi ${first},\n\nWe're holding ${e.name} on ${when}, ${where}. ${e.blurb}\n\nYou're welcome to bring a friend. Just reply to let us know you're coming.\n\nThe SDC team`,
    `Hi ${first},\n\nSave the date: ${e.name} is on ${when}, ${where}. ${e.blurb}\n\nNo need to sign up, but a quick reply helps us plan.\n\nThe SDC team`,
    `Hi ${first},\n\nMembers get the first invitation to ${e.name}. It's on ${when}, ${where}. ${e.blurb}\n\nWe'd love to see you.\n\nSuhanya`,
  ];
  return { title: `You're invited: ${e.name}`, body: bodies[v % bodies.length] };
}

export function eventReminderMail(first: string, e: DemoEvent, when: string, v: number): Mail {
  const where = e.place === "online" ? "online" : `at ${e.place}`;
  return {
    title: `Tomorrow: ${e.name}`,
    body: `Hi ${first},\n\nA reminder that ${e.name} is tomorrow (${when}), ${where}. ${TIPS[v % TIPS.length]}\n\nSee you there.\n\nThe SDC team`,
  };
}

export function volunteerAskMail(first: string, e: DemoEvent, when: string, v: number): Mail {
  const bodies = [
    `Hi ${first},\n\nWe're looking for a few volunteers for ${e.name} on ${when}. Jobs range from greeting people at the door to helping set up the room, and most shifts are about two hours.\n\nIf you can help, reply with the time that suits you.\n\nThe SDC team`,
    `Hi ${first},\n\n${e.name} is coming up on ${when}, and we'd love a few extra hands. You don't need any experience. We'll show you what to do when you arrive.\n\nReply to this email if you're in.\n\nSuhanya`,
  ];
  return { title: `Can you help with ${e.name}?`, body: bodies[v % bodies.length] };
}

export function personalMail(first: string, v: number): Mail {
  const all: Mail[] = [
    { title: "A quick thank-you", body: `Hi ${first},\n\nI wanted to say thank you personally for being part of SDC. Your membership helps us keep the community lunches free.\n\nSuhanya` },
    { title: "Checking in", body: `Hi ${first},\n\nI noticed we haven't seen you at an event in a while. No pressure at all. If there's a time or place that would work better for you, tell me and I'll pass it on.\n\nSuhanya` },
    { title: "Re: volunteering", body: `Hi ${first},\n\nThanks for asking about volunteering. The easiest way to start is our next orientation, which is short and online. I'll send you the link as soon as the date is set.\n\nSuhanya` },
    { title: "Following up from the lunch", body: `Hi ${first},\n\nIt was lovely to talk with you at the lunch. As promised, here's the link to our tenant rights guide. Please pass it on to anyone who might need it.\n\nSuhanya` },
    { title: "All sorted", body: `Hi ${first},\n\nI've updated your details and sent a fresh copy of your receipt. Let me know if anything still looks wrong.\n\nSuhanya` },
  ];
  return all[v % all.length];
}

export function referralMail(first: string, referredFirst: string): Mail {
  return {
    title: `${referredFirst} joined because of you`,
    body: `Hi ${first},\n\n${referredFirst} just became an SDC member through your invite. Thank you. This is how we grow.\n\nThe SDC team`,
  };
}
