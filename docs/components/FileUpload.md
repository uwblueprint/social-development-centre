# FileUpload

Pick or drag in one file. `FileUpload` is a dashed drop zone with an underlined action ("Upload or drag and drop a photo here"). `FileUploadButton` is a kit `Button` that opens the same picker, for replacing a file that's already in place. Taken from the member directory's spreadsheet import.

## Use when / Don't use when
- One file the admin chooses from their computer: a photo, a spreadsheet to import.
- Several files at once, as attachments to an email: the email editor's `Attachments` handles a list.
- A link to a file somewhere else: use `Input` with `type="url"`.

## API
```tsx
import { FileUpload, FileUploadButton, type FileRejection } from "@/components/ui/FileUpload";
```
Both take the picker options:
- `accept: readonly string[]` (required): MIME types, e.g. `["image/jpeg", "image/png"]`; `"image/*"` takes any image. Checked on pick and on drop, since a drop ignores the picker's filter.
- `maxBytes?: number`: the largest file.
- `onFile: (file: File) => void` (required): a file that passed both checks.
- `onReject: (reason: "type" | "size", file: File) => void` (required): called instead of `onFile`. You word the error and pass it to the `Field`.

`FileUpload` also takes:
- `action`, `prompt`, `dropPrompt` (required): the underlined word, the rest of the sentence, and the sentence while a file is dragged over. The button's accessible name is `action + prompt`, so it starts with the visible word.
- `limits?: string`: types and size in small text, e.g. "JPG, PNG or WebP, up to 5 MB". Added to the button's description.
- `icon?: LucideIcon`: above the sentence. Default `FileUp`.
- The `Field` props (`id`, `aria-describedby`, `aria-invalid`, `disabled`) land on the action button. An error turns the dashed border danger-coloured; the `Field` shows the icon and message.

`FileUploadButton` takes every `Button` prop except `onClick` and `type`, plus `busy?: boolean`: a spinner at the same width, `aria-busy`, and clicks ignored while the file uploads. Variant defaults to `secondary`.

## Example
```tsx
<Field label="Photo" error={error}>
  {(props) =>
    photo ? (
      <FileUploadButton {...props} accept={TYPES} maxBytes={MAX} onFile={upload} onReject={reject} busy={uploading}>
        Replace photo
      </FileUploadButton>
    ) : (
      <FileUpload
        {...props}
        accept={TYPES}
        maxBytes={MAX}
        onFile={upload}
        onReject={reject}
        icon={ImageUp}
        action="Upload"
        prompt="or drag and drop a photo here"
        dropPrompt="Drop the photo to upload it"
        limits="JPG, PNG or WebP, up to 5 MB"
      />
    )
  }
</Field>
```

## Content rules
- The action is one verb, "Upload". The prompt names the thing: "a photo", "a spreadsheet".
- `limits` lists the types the way people know them (JPG, not image/jpeg) and the size in MB.
- Rejection errors say what to choose instead: "Choose an image under 5 MB."

## Accessibility
- The action is a real button: Tab reaches it, Enter or Space opens the picker. Dragging is never the only way in.
- The native file input is hidden and out of the tab order; the button opens it.
- An error is a message with an icon from the `Field`, not only the red border.

## Don't
1. Starting the upload in `onReject`, or checking type and size yourself a second time.
2. Making the whole zone clickable. Only the action is a button, so the zone stays easy to drop on and the focus ring is clear.
3. Rendering a native `<input type="file">` in a feature. Use this component.
