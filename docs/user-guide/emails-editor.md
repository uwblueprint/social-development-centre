# Email editor

For SDC admins. The same editor is used to write an automatic email, a one-off email, and to change a single email waiting in the Outbox.

## Write an email

1. Open the email you are writing.
2. Type a **Subject**. It is plain text.
3. Type your **Message**. In an empty email, a short prompt suggests what to write. It goes away when you start typing.
4. Use the buttons above the message: **Bold**, **Italic**, **Add link**, **Bulleted list**, **Numbered list**.

The editor only keeps these kinds of formatting. Anything else is removed.

## Add a link

1. Select the words you want to turn into a link. If you select nothing, the address itself becomes the link text.
2. Choose **Add link**.
3. Type a **Link address**, for example `https://example.org`, then choose **Add link** (or press Enter).
4. To take a link away, put the cursor in it, choose **Add link**, then choose **Remove link**.

If the address isn't valid you will see "Enter a web address like https://example.org, or an email address."

## Use a member's details (variables)

1. Put the cursor in the **Subject** or the **Message**.
2. Choose **Insert variable**, or type `{`.
3. Pick a detail, for example **First name**. It appears as a labeled chip, not as code.

The list only shows details that work for this email. A "Member joins via referral" email can use the referrer's name; a one-off email can only use member details.

- Hover over (or focus) a chip to see an example, such as "Example: Amira".
- To remove a chip, put the cursor after it and press Backspace, or select it and press Backspace.

## Change what shows when a detail is missing

1. Click a chip. With the keyboard, press Shift+Arrow to select it, then Enter.
2. Type the **Fallback for First name**.
3. Choose **Save fallback**. Choose **Reset to default** to go back to the standard wording.

There is one fallback per detail. It applies to every email not yet sent, not just the one you are editing. Leave it empty to show nothing.

## Paste from Word, Google Docs or Gmail

Paste as normal. Only bold, italic, links, lists and paragraphs are kept. Fonts, colours and images are removed.

## Check the footer

Under the message you will see a greyed-out footer with the name, mailing address and an unsubscribe link. It is added to every email automatically and can't be changed in the editor.

## Preview an email

1. Choose **Preview**. (This tab appears when the page offers a preview.)
2. In **Preview as**, pick a member, or **Member with missing details** to see your fallbacks.
3. Choose **Edit** to go back.

## Send a test email

1. Fill in the subject and message.
2. Choose **Send test email**.
3. You will see "Test email sent to your inbox. The subject starts with [TEST]."

If it can't be sent you will see the reason next to the button.

## Fix problems the editor finds

If the subject or message is empty, or a variable doesn't apply to this email (for example after you changed the moment), a message appears under the field. Choose **Jump to it** to go straight to the spot.
