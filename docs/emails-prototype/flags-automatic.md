# Automatic emails

**Where do tags come from?** The PRD says "Tag added to member. The admin picks the tag." It doesn't say where the list of tags comes from. The prototype offers the tags that current members have, so a tag no member has yet can't be picked.

**What does "joined in [month]" mean?** The PRD says "Joined before [date], joined after [date], or joined in [month]." It doesn't say whether the month includes the year. The prototype uses one specific month and year.

**Can N be 0?** The PRD says "N days after" but gives no range. N = 0 would act the same as Same day. The prototype allows 1 or more.

**Two admins on the same draft.** The PRD says "Several admins, no roles" and covers an admin unpublishing while another has a send open. It doesn't cover two admins editing the same draft. The prototype keeps the last save.

**Does a tag clash block publishing?** The PRD says "If the same tag is both included and excepted, flag the conflict before publishing." It doesn't say whether the admin can still publish. The prototype blocks publishing until it is fixed.
