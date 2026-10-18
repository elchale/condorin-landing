"use client";

import { useEffect, useSyncExternalStore } from "react";

type Platform = "android" | "ios";

/**
 * WhatsApp (and Facebook, Instagram) open links in their own in-app browser, where the session is lost
 * as soon as the chat is closed. A template button cannot choose the browser, so the page hands itself
 * over: an Android intent opens the default browser, and iOS 17+ understands x-safari-https.
 * It tries once per link on its own; the banner stays as a manual fallback.
 */
function inAppPlatform(): Platform | null {
  const ua = navigator.userAgent;
  if (!/WhatsApp|FBAN|FBAV|FB_IAB|Instagram|; wv\)/i.test(ua)) return null;
  if (/Android/i.test(ua)) return "android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  return null;
}

function externalUrl(platform: Platform, href: string) {
  if (platform === "ios") return `x-safari-${href}`;
  const url = new URL(href);
  return `intent://${url.host}${url.pathname}${url.search}#Intent;scheme=https;S.browser_fallback_url=${encodeURIComponent(href)};end`;
}

const noSubscribe = () => () => {};

export function OpenInBrowser({ token }: { token: string }) {
  // The user agent never changes, so there is nothing to subscribe to; null on the server.
  const platform = useSyncExternalStore(noSubscribe, inAppPlatform, () => null);

  useEffect(() => {
    const found = platform;
    if (!found) return;
    const key = `cdn_escape_${token}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      return; // no storage: do not risk a redirect loop, the banner is enough
    }
    window.location.href = externalUrl(found, window.location.href);
  }, [platform, token]);

  if (!platform) return null;
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-tinta p-4 text-sm text-white sm:flex-row sm:items-center sm:justify-between">
      <p>Estás dentro de WhatsApp. Ábrelo en tu navegador para que tu sesión se mantenga.</p>
      <a
        href={externalUrl(platform, typeof window === "undefined" ? "" : window.location.href)}
        className="shrink-0 rounded-xl bg-white px-4 py-2.5 text-center font-bold text-tinta"
      >
        Abrir en el navegador
      </a>
    </div>
  );
}
