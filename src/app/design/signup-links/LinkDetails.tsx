"use client";

import * as React from "react";
import { styled } from "next-yak";
import QRCode from "qrcode";
import { Button } from "@/components/ui/Button";
import { DialogActions } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { signupLinkUrl, type SignupLink } from "./data";

/** Copies a link's URL and confirms with a toast. */
export function useCopyLink() {
  const { toast } = useToast();
  return async (link: SignupLink) => {
    try {
      await navigator.clipboard.writeText(signupLinkUrl(link.slug));
      toast({ title: "Link copied" });
    } catch {
      toast({ title: "Couldn’t copy the link", description: "Your browser blocked it. Try again." });
    }
  };
}

/* One column: the link row, then the code, both on the dialog's left and right content edges. */
const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-top: var(--space-4);
`;

/* The button takes the input's height instead of a height of its own, so the two always match. */
const UrlRow = styled.div`
  display: flex;
  align-items: stretch;
  gap: var(--space-2);

  & > :first-child {
    flex: 1;
    min-width: 0;
  }
`;

const CopyButton = styled(Button)`
  height: auto;
`;

/* The code sits on its own light ground, so it scans in dark mode too. The box keeps its size while the image renders. */
const Frame = styled.div`
  width: calc(var(--space-8) * 3);
  height: calc(var(--space-8) * 3);
  background: var(--qr-ground);
  /* The code's quiet zone is white on white; the border shows the box so its edge lines up with the field above. */
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  overflow: hidden;
`;

const Image = styled.img`
  display: block;
  width: 100%;
  height: 100%;
`;

/* Three buttons at 360px wrap instead of overflowing. */
const Footer = styled(DialogActions)`
  flex-wrap: wrap;
`;

/** The code as a PNG data URL, drawn in the browser. Colors come from the --qr-* tokens. */
function useQrImage(url: string): string | null {
  const [image, setImage] = React.useState<{ url: string; data: string } | null>(null);
  React.useEffect(() => {
    let current = true;
    const styles = getComputedStyle(document.documentElement);
    QRCode.toDataURL(url, {
      width: 576,
      margin: 2,
      errorCorrectionLevel: "M",
      color: {
        dark: styles.getPropertyValue("--qr-ink").trim(),
        light: styles.getPropertyValue("--qr-ground").trim(),
      },
    }).then((data) => {
      if (current) setImage({ url, data });
    });
    return () => {
      current = false;
    };
  }, [url]);
  return image?.url === url ? image.data : null;
}

/**
 * The body and footer shared by the create result and the QR dialog: the link with Copy, the QR code,
 * then every action in one right-aligned row. The caller supplies the DialogTitle and, for the create
 * result, `onDone`.
 */
export function LinkDetails({ link, onDone }: { link: SignupLink; onDone?: () => void }) {
  const { toast } = useToast();
  const copyLink = useCopyLink();
  const url = signupLinkUrl(link.slug);
  const image = useQrImage(url);

  async function copyImage() {
    if (!image) return;
    try {
      // Safari only allows the clipboard write inside the click if the blob is passed as a promise.
      const blob = fetch(image).then((response) => response.blob());
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      toast({ title: "Image copied" });
    } catch {
      toast({ title: "Couldn’t copy the image", description: "Your browser blocked it. Use Download instead." });
    }
  }

  function download() {
    if (!image) return;
    const anchor = document.createElement("a");
    anchor.href = image;
    anchor.download = `${link.slug.slice(0, 80)}.png`;
    anchor.click();
  }

  return (
    <>
      <Stack>
        <Field label="Link">
          {(props) => (
            <UrlRow>
              <Input {...props} readOnly value={url} />
              <CopyButton type="button" $variant="secondary" onClick={() => copyLink(link)}>
                Copy
              </CopyButton>
            </UrlRow>
          )}
        </Field>
        <Frame>{image && <Image src={image} alt={`QR code for ${link.name}`} />}</Frame>
      </Stack>
      <Footer>
        <Button type="button" $variant="secondary" onClick={copyImage}>
          Copy image
        </Button>
        <Button type="button" $variant="secondary" onClick={download}>
          Download
        </Button>
        {onDone && (
          <Button type="button" onClick={onDone}>
            Done
          </Button>
        )}
      </Footer>
    </>
  );
}
