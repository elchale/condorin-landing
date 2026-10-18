"use client";

import { useEffect, useState } from "react";
import { WelcomeOverlay } from "@/components/brand/WelcomeOverlay";
import { signInWithLink } from "./api";

/**
 * Opening an alert link (expediente or evento) signs the member in, so the panel is one tap away
 * (see /api/enlace). Returns whether there is a session and the "Entraste como <ONG>" overlay to render.
 */
export function useLinkSignIn(token: string, initiallySignedIn: boolean) {
  const [signedIn, setSignedIn] = useState(initiallySignedIn);
  const [welcome, setWelcome] = useState<{ ong: string; name?: string } | null>(null);

  useEffect(() => {
    if (initiallySignedIn) return;
    signInWithLink(token).then((r) => {
      setSignedIn(r.signedIn);
      if (r.fresh && r.ong) setWelcome({ ong: r.ong, name: r.name });
    });
  }, [initiallySignedIn, token]);

  const overlay = welcome && <WelcomeOverlay ong={welcome.ong} name={welcome.name} onDone={() => setWelcome(null)} />;
  return { signedIn, overlay };
}
