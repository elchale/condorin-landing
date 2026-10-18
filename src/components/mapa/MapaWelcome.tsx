"use client";

import { useRouter } from "next/navigation";
import { WelcomeOverlay } from "@/components/brand/WelcomeOverlay";

/** After signing in on /entrar: the overlay, then the URL loses ?bienvenida and the map stays. */
export function MapaWelcome({ ong, name }: { ong: string; name: string }) {
  const router = useRouter();
  return <WelcomeOverlay ong={ong} name={name} onDone={() => router.replace("/", { scroll: false })} />;
}
