"use client";

import * as React from "react";
import { styled } from "next-yak";
import QRCode from "qrcode";
import { Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { signupLinkUrl, type SignupLink } from "./data";

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
`;

/* The code always sits on its own light ground, so it scans in dark mode too. The box keeps its size while the image renders. */
const Frame = styled.div`
  width: calc(var(--space-8) * 3);
  height: calc(var(--space-8) * 3);
  background: var(--qr-ground);
  border-radius: var(--radius-md);
  overflow: hidden;
`;

const Image = styled.img`
  display: block;
  width: 100%;
  height: 100%;
`;

const Buttons = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-2);
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

/** A link's QR code with Copy image and Download. Used by the create result and the row's QR dialog. */
export function QrPanel({ link }: { link: SignupLink }) {
  const { toast } = useToast();
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
    <Wrap>
      <Frame>{image && <Image src={image} alt={`QR code for ${link.name}`} />}</Frame>
      <Buttons>
        <Button type="button" $variant="secondary" onClick={copyImage}>
          <Icon icon={Copy} />
          Copy image
        </Button>
        <Button type="button" $variant="secondary" onClick={download}>
          <Icon icon={Download} />
          Download
        </Button>
      </Buttons>
    </Wrap>
  );
}
