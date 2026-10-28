"use client";

import * as React from "react";
import QRCode from "qrcode";
import { useToast } from "@/components/ui/Toast";
import { signupLinkUrl, type SignupLink } from "../data";

/** Copies a link's URL and confirms with a toast. Resolves to whether the copy worked. */
export function useCopyLink() {
  const { toast } = useToast();
  return async (link: SignupLink): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(signupLinkUrl(link.slug));
      toast({ title: "Link copied" });
      return true;
    } catch {
      toast({ title: "Couldn’t copy the link", description: "Your browser blocked it. Try again." });
      return false;
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

/** How long "Copied" stays on a link button before it goes back to the link. */
const COPIED_MS = 2000;

export interface LinkActions {
  link: SignupLink;
  url: string;
  /** The QR code as a PNG data URL, or null while it draws. */
  image: string | null;
  /** True for a moment after the link was copied, for inline confirmation next to the toast. */
  linkCopied: boolean;
  copyLink: () => void;
  copyImage: () => void;
  download: () => void;
}

/** The data and actions every link dialog layout shares: the URL, the QR image, copy link, copy image, download. */
export function useLinkActions(link: SignupLink): LinkActions {
  const { toast } = useToast();
  const copy = useCopyLink();
  const url = signupLinkUrl(link.slug);
  const image = useQrImage(url);
  const [linkCopied, setLinkCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function copyLink() {
    if (!(await copy(link))) return;
    setLinkCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setLinkCopied(false), COPIED_MS);
  }

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

  return { link, url, image, linkCopied, copyLink, copyImage, download };
}
