// Design screens that don't exist yet (e.g. a section whose design isn't merged) 404 inside the sidebar,
// like unknown admin URLs do, so you can always click back out.
import { notFound } from "next/navigation";

export default function Missing() {
  notFound();
}
