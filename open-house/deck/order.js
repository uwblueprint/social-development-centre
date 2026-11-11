/* Slide order and script for the current talk.
   Slides are still defined in t1-t5.js; this file picks the order, sets each slide's script (the S box), and hides
   slides the script doesn't use. Nothing is deleted: open deck.html?hidden to append the hidden slides at the end. */
(() => {
  const all = SLIDES.slice();
  /* names for the slides as they are defined in the files */
  const S = { intro: 0, community: 1, logo: 2, funding: 3, donors: 4, texts: 5, flatline: 6, verbs: 7, hundred: 8, quote: 9, phones: 10, notesWall: 11, composer: 12, christmas: 13, approval: 14, record: 15, todo: 16, potluck: 17, workload: 18, platform: 19 };
  const use = (key, notes) => { const s = all[S[key]]; s.notes = notes; return s; };

  const order = [
    use("intro", "Hi, my name is Gaurav, and I'm a product manager on the SDC team at Blueprint."),
    use("community", "Every community runs on people who hold it together. Some organize tenants' rights meetings. Others speak up at city council. But advocacy takes time, skills, and money. Someone has to make sure that work can continue."),
    use("logo", "The Social Development Centre in Kitchener-Waterloo supports community-led change through research, homelessness prevention, employment support, and partnerships with grassroots organizations."),
    use("funding", "But there's a catch. Speaking up is harder when the people you're asking to change are also the people funding you. Independent funding helps nonprofits stay true to their mission."),
    use("donors", "That's where community support comes in. Some people support SDC with money, others give their time, and others contribute their skills. However they help, they're all part of the community that makes SDC's work possible."),
    use("verbs", "But keeping those people involved takes work. Nonprofits call this donor stewardship: thanking people for their support, keeping in touch, and helping them stay connected to the cause."),
    use("workload", "Suhanya, a staff member at SDC, manages these relationships alongside everything else that comes with running a nonprofit. And that's not easy."),
    use("texts", "Meet Stephen. He's not an activist. A friend asked, so he chipped in. He gave fifty dollars, and it felt good."),
    use("phones", "But a month later, he hasn't heard from SDC. He doesn't know about its future work or other ways to get involved. He has no connection to the organization..."),
    use("flatline", "...and so naturally, he never donates again."),
    use("hundred", "It wasn't that SDC didn't care. Suhanya and her team simply didn't have the time to keep up with everyone. Now imagine a hundred donors like Stephen: a hundred thank-you emails, follow-ups, and relationships to maintain. With only a few hours in the day, who do you call? Whose email do you personalize?"),
    use("platform", "So how do we make it easier to build those relationships?\n\nWe're building a platform that simplifies donor stewardship and takes the administrative work off SDC's plate."),
    use("record", "First, a member directory gives SDC a place to keep track of each person, including their interests, when they joined, and what they've shared. When Suhanya reconnects with someone, she has the context to make that conversation personal."),
    use("notesWall", "Two months later, she might even remember to ask about Stephen's daughter."),
    use("composer", "Second, we automate routine communications. Suhanya can write a thank-you email once, in her own words, and the platform helps send it to every donor."),
    use("christmas", "She can prepare a holiday email in November and schedule it for Christmas Eve."),
    use("approval", "For major donors, the email can wait for her approval so she can add that extra human touch."),
    use("todo", "The platform handles the admin work of remembering and sending. That way Suhanya has more time to do what only a human can: build relationships."),
    use("potluck", "Because a community needs all kinds of people to thrive. Some bring money, others bring time, and others bring skills. Together, they bring a community to life.\n\nThink of it like a potluck. Everyone brings something different, and someone has to bring everyone together, make sure they feel welcome, and invite them back.\n\nWe're building the place where that happens. A home for the people who make a community possible, and the person who brings them together.\n\nThat's why we call it Potluck. (Press next when you say \"Potluck\".) We're launching with SDC in early December."),
  ];
  /* chosen versions go first; the rest follow */
  const prefer = (key, names) => { const v = all[S[key]].variants, rank = (x) => { const i = names.indexOf(x.name); return i < 0 ? 99 : i; }; v.sort((a, b) => rank(a) - rank(b)); };
  /* discard everything but the chosen version (kept in s.archived) */
  const only = (key, name) => { const s = all[S[key]]; s.archived = (s.archived || []).concat(s.variants.filter((v) => v.name !== name)); s.variants = s.variants.filter((v) => v.name === name); };
  only("notesWall", "A spotlight finds it");
  only("christmas", "Two postmarks");
  only("todo", "One task left");
  only("potluck", "Three beats, on your cue");
  prefer("verbs", ["Thank, back and forth, connected", "Warmth that fades", "Tending a plant", "Everyone has to be tended"]);
  prefer("workload", ["Relationships get buried"]);
  prefer("platform", ["A window opens"]);
  prefer("potluck", ["Three beats, on your cue"]);
  const hidden = all.filter((s) => !order.includes(s));
  SLIDES.length = 0; order.forEach((s) => SLIDES.push(s));
  window.HIDDEN_SLIDES = hidden;
  if (/[?&]hidden/.test(location.search)) hidden.forEach((s) => SLIDES.push(s));
})();
