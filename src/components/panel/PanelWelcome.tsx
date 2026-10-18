"use client";

import { useRouter } from "next/navigation";
import { WelcomeOverlay } from "@/components/brand/WelcomeOverlay";

/** Right after signing in with the code: the overlay, then the URL loses ?bienvenida so a reload skips it. */
export function PanelWelcome({ ong, name }: { ong: string; name: string }) {
  const router = useRouter();
  return <WelcomeOverlay ong={ong} name={name} onDone={() => router.replace("/panel", { scroll: false })} />;
}
