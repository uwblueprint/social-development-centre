# Sending rules (apply to every flow)

**A moment inside the send window.** The PRD says Same day "sends in the next send window. A moment after 11:30 a.m. sends in the next day's window." It doesn't say what happens to a moment between 10:30 and 11:30. The prototype sends it a minute later.

**Does Don't send survive an unpublish and publish?** The PRD says "Publishing rebuilds every send" and "'Not sent: Unpublished' must not block re-creation." It doesn't say whether a send she removed with Don't send comes back. The prototype keeps it removed.

**The monthly-limit warning is undefined.** The Automatic and One-off PRDs say limit warnings are "defined in Email Frequency". That page is marked work in progress and out of date. So nothing yet says what the warning shows, who it names, or which emails count. The prototype counts every email sent or waiting this month and only warns.
