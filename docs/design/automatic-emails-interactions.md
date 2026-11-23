# Automatic emails: the details that make it work

Most of this screen is what you'd expect from any email tool. These are the decisions that took it further.

1. **The page asks three questions in the order people think about them.** In testing, admins blurred "who gets this" and "when does it go out" into one idea and got lost. Splitting the page into Who gets it, When it sends and What it says, each with its own heading, made the setup read like a checklist they already had in their head.

2. **You never have to learn Boolean logic.** Research and our own tests showed people read "Volunteer and Youth" as "volunteers and youth", which is the opposite of what the logic means. So there is no and/or switch. You say who to send to, then add "Must have" or "Exclude" as separate rows, and each row reads as a plain sentence.

3. **You can type what you mean.** Typing "-housing" excludes the Housing tag, "+housing" makes it required, and "joined before nov 5" or "nov 1 - nov 4" sets the join date. The full tag list stays on screen while you do it, so the shortcut speeds you up without hiding your options.

4. **Mistakes are quietly fixed instead of flagged.** If you put a tag in two places, it moves to the last one. If you type a date range backwards, it's flipped. If you leave out the year, we assume this one. The page reads what you meant and gets on with it, so there are almost no error messages on the whole screen.

5. **The member count tells you who will actually get the email.** It accounts for timing as well as tags, so a "30 days after joining" email only counts people who joined in the last 30 days. When we watched people publish, their biggest worry was "did I set this up right?", and this number answers it before they hit Publish.

6. **The tag field behaves like text.** You can put your cursor between tags, select several with Shift and the arrow keys, delete them together and undo with Ctrl+Z. Backspace selects a tag before deleting it, so one stray key can't wipe out your work. Once you've deleted one, the next presses delete straight away, because by then we know you mean it.

7. **The delay remembers what you meant.** Pick days and it suggests 30; switch to weeks and it suggests 1. Once you type your own number, switching units leaves it alone. The field only accepts whole numbers, so there's nothing to get wrong and nothing to warn about.

8. **Personalising is as fast as typing a name.** Type "@" and the rest of the detail appears faintly where you're typing, with a small Tab hint. Press Tab and it's in. If you add a comma or full stop right after, the extra space disappears on its own.

9. **The date picker stays put while you use it.** Picking dates changes the width of the text that opened it, and most pickers jump around when that happens. Ours stays where it opened. You can also zoom out to pick a month or year without losing the first date you chose.

10. **Highlights survive Outlook.** Most editors save highlights in a way Outlook ignores. Ours saves them in the one format every major email client respects, so what you see is what members get.

11. **The publish dialog speaks plainly.** It says when the email sends, who gets it and how many people are scheduled right now, in short sentences. If your email says "attached" and nothing is attached, it asks before sending.

12. **Everything is calm.** Motion is limited to short fades and slides that show where something came from. Menus open where your eye already is. Long lists cut off their last row slightly, which tells you there's more without a "scroll for more" label.

13. **It works for everyone.** Every tooltip is also read aloud by screen readers, nothing relies on colour alone, and the whole flow can be done from the keyboard. It passes automated accessibility checks in every state, not just the first screen.
