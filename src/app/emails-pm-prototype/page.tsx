import { redirect } from "next/navigation";

export default function EmailsHome() {
  redirect("/emails-pm-prototype/outbox");
}
