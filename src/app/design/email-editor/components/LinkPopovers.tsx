"use client";

import * as React from "react";
import { styled } from "next-yak";
import type { Editor } from "@tiptap/react";
import { Check, Copy, Pencil, Unlink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/Popover";
import { Tooltip } from "@/components/ui/Tooltip";
import { EMAIL_LIMITS, emailEditorCopy as copy } from "../copy";
import { normalizeUrl } from "./shortcuts";

/** Where a link popup points: the toolbar's link button, or a link in the text. */
export type LinkUi =
  | { kind: "edit"; rect: DOMRect }
  | { kind: "menu"; rect: DOMRect; href: string }
  | null;

/** Radix positions against this; a new object whenever the rect changes. */
function useVirtualAnchor(rect: DOMRect): React.RefObject<{ getBoundingClientRect: () => DOMRect }> {
  return React.useMemo(() => ({ current: { getBoundingClientRect: () => rect } }), [rect]);
}

/**
 * Add or change a link. Opens centred above what it points at; Radix flips it directly below
 * when there's no room above.
 */
export function LinkEditor({ editor, rect, onClose }: { editor: Editor; rect: DOMRect; onClose: () => void }) {
  const anchor = useVirtualAnchor(rect);
  const editing = editor.isActive("link");
  const needText = editor.state.selection.empty && !editing;
  const [url, setUrl] = React.useState<string>(editing ? (editor.getAttributes("link").href ?? "") : "");
  const [text, setText] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim().length > EMAIL_LIMITS.urlMax) return setError(copy.link.tooLong);
    const href = normalizeUrl(url);
    if (!href) return setError(copy.link.invalid);
    const { from, to } = editor.state.selection;
    if (!needText && editor.state.doc.textBetween(from, to).length > EMAIL_LIMITS.linkTextMax) return setError(copy.link.textTooLong);

    if (needText) {
      const label = text.trim() || url.trim().replace(/^https?:\/\//, "");
      editor
        .chain()
        .focus()
        .insertContent([
          { type: "text", text: label, marks: [{ type: "link", attrs: { href } }] },
          { type: "text", text: " " },
        ])
        .run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    }
    onClose();
  };

  return (
    <Popover open onOpenChange={(open) => !open && onClose()}>
      <PopoverAnchor virtualRef={anchor} />
      <SmallPopover side="top" align="center" showClose={false}>
        <Form onSubmit={submit} noValidate>
          {needText && (
            <Field label={copy.link.textLabel}>
              {(props) => (
                <Input
                  {...props}
                  placeholder={copy.link.textPlaceholder}
                  value={text}
                  maxLength={EMAIL_LIMITS.linkTextMax}
                  onChange={(e) => {
                    setText(e.target.value);
                    setError(null);
                  }}
                />
              )}
            </Field>
          )}
          <Field label={copy.link.urlLabel} error={error && <span role="alert">{error}</span>}>
            {(props) => (
              <Input
                {...props}
                type="url"
                placeholder={copy.link.urlPlaceholder}
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError(null); // the error goes away as soon as they type again
                }}
              />
            )}
          </Field>
          <Actions>
            <Button type="submit" $size="sm">
              {editing ? copy.link.save : copy.link.add}
            </Button>
          </Actions>
        </Form>
      </SmallPopover>
    </Popover>
  );
}

/** Clicking a link selects all of it and offers copy, edit and remove beside it. */
export function LinkMenu({
  editor,
  rect,
  href,
  onEdit,
  onClose,
}: {
  editor: Editor;
  rect: DOMRect;
  href: string;
  onEdit: () => void;
  onClose: () => void;
}) {
  const anchor = useVirtualAnchor(rect);
  const [copied, setCopied] = React.useState(false);

  const copyLink = () => {
    navigator.clipboard?.writeText(href).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => undefined,
    );
  };

  return (
    <Popover open onOpenChange={(open) => !open && onClose()}>
      <PopoverAnchor virtualRef={anchor} />
      <MenuPopover side="right" align="center" showClose={false} onOpenAutoFocus={(e) => e.preventDefault()}>
        <Url title={href}>{href.replace(/^https?:\/\//, "")}</Url>
        <Divider aria-hidden="true" />
        <Tooltip content={copied ? copy.link.copied : copy.link.copy} pinOnClick={false}>
          <IconButton type="button" $variant="ghost" aria-label={copy.link.copy} onClick={copyLink}>
            <Icon icon={copied ? Check : Copy} size={16} />
          </IconButton>
        </Tooltip>
        <Tooltip content={copy.link.edit} pinOnClick={false}>
          <IconButton type="button" $variant="ghost" aria-label={copy.link.edit} onClick={onEdit}>
            <Icon icon={Pencil} size={16} />
          </IconButton>
        </Tooltip>
        <Tooltip content={copy.link.remove} pinOnClick={false}>
          <IconButton
            type="button"
            $variant="ghost"
            aria-label={copy.link.remove}
            onClick={() => {
              editor.chain().focus().extendMarkRange("link").unsetLink().run();
              onClose();
            }}
          >
            <Icon icon={Unlink} size={16} />
          </IconButton>
        </Tooltip>
      </MenuPopover>
    </Popover>
  );
}

const SmallPopover = styled(PopoverContent)`
  width: min(288px, calc(100vw - var(--space-5)));
`;

const MenuPopover = styled(PopoverContent)`
  width: auto;
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1);
  font-size: var(--text-xs);
  line-height: var(--leading-ui);
`;

const Form = styled.form`
  display: grid;
  gap: var(--space-2);
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const Url = styled.span`
  max-width: 220px;
  padding: 0 var(--space-2);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--color-text-muted);
`;

const Divider = styled.span`
  width: 1px;
  height: 20px;
  background: var(--color-border);
`;

const IconButton = styled(Button)`
  width: 28px;
  height: 28px;
  padding: 0;
`;
