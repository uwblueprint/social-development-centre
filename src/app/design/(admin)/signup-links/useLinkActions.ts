"use client";

import * as React from "react";
import QRCode from "qrcode";
import { useToast } from "@/components/ui/Toast";
import { signupLinkUrl, type SignupLink } from "./data";

/** Copies a link's URL and confirms with a toast. */
export function useCopyLink() {
  const { toast } = useToast();
  return async (link: SignupLink) => {
    try {
      await navigator.clipboard.writeText(signupLinkUrl(link.slug));
      toast({ title: "Member join link copied to clipboard", description: link.name });
    } catch {
      toast({ title: "Couldn’t copy the link", description: "Your browser blocked it. Try again." });
    }
  };
}

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

export interface LinkActions {
  link: SignupLink;
  url: string;
  /** The QR code as a PNG data URL, or null while it draws. */
  image: string | null;
  copyLink: () => void;
  download: () => void;
}

/** The link dialog's data and actions: the URL, the QR image, copy link and download. */
export function useLinkActions(link: SignupLink): LinkActions {
  const copy = useCopyLink();
  const url = signupLinkUrl(link.slug);
  const image = useQrImage(url);

  function download() {
    if (!image) return;
    const anchor = document.createElement("a");
    anchor.href = image;
    anchor.download = `${link.slug.slice(0, 80)}.png`;
    anchor.click();
  }

  return { link, url, image, copyLink: () => copy(link), download };
}
