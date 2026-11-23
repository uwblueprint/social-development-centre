/* Slide order and script for the current talk.
   Slides are still defined in t1-t5.js; this file picks the order, sets each slide's script (the S box), and hides
   slides the script doesn't use. Nothing is deleted: open deck.html?hidden to append the hidden slides at the end. */
(() => {
  const all = SLIDES.slice();
  /* names for the slides as they are defined in the files */
  const S = { intro: 0, community: 1, logo: 2, funding: 3, donors: 4, texts: 5, flatline: 6, verbs: 7, hundred: 8, quote: 9, phones: 10, notesWall: 11, composer: 12, christmas: 13, approval: 14, record: 15, todo: 16, potluck: 17, workload: 18, platform: 19 };
  const use = (key, notes) => { const s = all[S[key]]; s.notes = notes; return s; };

  const order = [
    use("intro", "Hi everyone! I'm Gaurav, and I'm one of the PMs on the SDC team."),
    use("community", "Every community has a few people holding it together. Some run tenants' rights meetings and some show up at city council. That work costs money, and somebody has to pay for it."),
    use("logo", "The Social Development Centre is one of those groups, right here in Waterloo Region. They do research, homelessness prevention and employment support, and they back a lot of grassroots organizations."),
    use("funding", "Funding is tricky for them. If you're pushing the government to change something, it gets awkward when the government also pays your bills."),
    use("donors", "So SDC is starting a membership program. You give whatever you can, money or time, and you get a community back.\n\nI think about this a lot because of Blueprint. I gave this club years of my time, and I got my best friends out of it. If Blueprint asked me to donate tomorrow, I'd say yes before they finished the sentence. SDC wants people to feel that way about them."),
    use("verbs", "Nonprofits have a name for keeping people around like that. They call it stewardship, and most of it comes down to staying in touch."),
    use("workload", "At SDC, that's Suhanya's job. She works 20 hours a week, and everything else in a nonprofit wants those hours too."),
    use("texts", "Meet Stephen. He's not an activist. A friend was raising money for SDC and texted him to chip in. He gave fifty dollars, and it felt good."),
    use("phones", "A month later, he still hasn't heard from SDC..."),
    use("flatline", "...so naturally, the relationship dies and he never gives again."),
    use("hundred", "SDC cares about Stephen. They just have no way to keep up with him. Right now, someone who gives barely hears anything back. There's no system for sending stewardship emails, and there aren't enough hours to do it all by hand.\n\nNow picture a hundred Stephens. You have ten minutes. Who do you reach out to?"),
    use("platform", "So we're building that system. It sends the thank-you Stephen never got, and it takes the admin work of stewardship off SDC's plate.\n\nSDC is running membership for the very first time, so we do the research too. We find out what works for nonprofits like them and build it straight into the product."),
    use("record", "Every member gets a page with everything SDC knows about them, from the day they joined to the last email they got."),
    use("notesWall", "So two months later, she might even remember to ask about Stephen's daughter."),
    use("composer", "Suhanya writes a thank-you ONCE, in her own words, and every new member gets it the day they join."),
    use("christmas", "She can write the holiday email in November, on a quiet afternoon, and it lands on Christmas Eve."),
    use("approval", "And for the people who mean the most, the email waits for her first."),
    use("todo", "The platform does the remembering and the sending. That leaves Suhanya with the part only she can do."),
    use("potluck", "A community is a lot like a potluck. Everyone brings something different. Some bring money and some bring their weekends.\n\nWe're building the place that brings it all together, and we call it Potluck. (Press next on \"Potluck\".) We launch with SDC in December. Thank you!"),
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
