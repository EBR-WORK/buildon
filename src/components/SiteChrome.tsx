"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import BackToTop from "./BackToTop";
import ChatWidget from "./ChatWidget";
import QuotePanel from "./QuotePanel";

/**
 * The floating furniture that belongs to the public site: the back-to-top
 * button, the "Get a Quote" tab and the chat assistant.
 *
 * All three are rendered by the root layout, which the admin panel also sits
 * under — so a "Get a Quote" tab was floating over the content editor. They are
 * hidden under /admin: the admin is a tool, not a page a visitor is being sold
 * to, and the tab overlapped its save bar.
 *
 * The chat's open state is held here rather than inside it because it is not
 * only the chat's business: the panel fills the bottom-right corner, which is
 * also where back-to-top lives, and that button has to get out of the way.
 */
export default function SiteChrome() {
  const pathname = usePathname();
  const [chatOpen, setChatOpen] = useState(false);

  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      <BackToTop hidden={chatOpen} />
      <QuotePanel />
      <ChatWidget onOpenChange={setChatOpen} />
    </>
  );
}
