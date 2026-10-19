// Unknown member URLs render inside the member layout, so the top bar stays visible.
import { notFound } from "next/navigation";

export default function Missing() {
  notFound();
}
