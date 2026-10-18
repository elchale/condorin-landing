import { redirect } from "next/navigation";

/** This app is only the admin panel (admin.condorin.pe); the public site is the SPA at www.condorin.pe. */
export default function Home() {
  redirect("/admin");
}
