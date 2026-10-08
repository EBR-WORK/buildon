import { JSDOM } from "jsdom";
const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
for (const k of ["window","document","HTMLElement","Element","Node","DOMParser","MutationObserver"]) {
  Object.defineProperty(globalThis, k, { value: dom.window[k], configurable: true, writable: true });
}
Object.defineProperty(globalThis, "requestAnimationFrame", { value: (cb) => setTimeout(cb, 0), configurable: true, writable: true });
Object.defineProperty(globalThis, "cancelAnimationFrame", { value: clearTimeout, configurable: true, writable: true });
Object.defineProperty(globalThis, "getComputedStyle", {
  value: dom.window.getComputedStyle.bind(dom.window), configurable: true, writable: true,
});

const { createJiti } = await import("file:///D:/buildon/node_modules/jiti/lib/jiti.mjs");
const path = await import("node:path");
const jiti = createJiti(import.meta.url, { alias: { "@": path.resolve("src") } });
const { docToBlocks } = await jiti.import(path.resolve("src/lib/cms/richdoc.ts"));

const { Editor } = await import("@tiptap/core");
const StarterKit = (await import("@tiptap/starter-kit")).default;
const Link = (await import("@tiptap/extension-link")).default;
const Image = (await import("@tiptap/extension-image")).default;

const editor = new Editor({
  element: dom.window.document.body,
  extensions: [
    StarterKit.configure({ blockquote:false, codeBlock:false, code:false, horizontalRule:false,
      strike:false, italic:false, orderedList:false, heading:{levels:[2,3]}, link:false }),
    Link.configure({ openOnClick:false, autolink:false, protocols:["http","https"] }),
    Image.configure({ inline:false, allowBase64:false }),
  ],
  content: { type:"doc", content:[{ type:"paragraph", content:[{ type:"text", text:"Buildon P-20 is a premixed plaster." }] }] },
});

const say = (ok, label, detail="") => console.log(`  ${ok ? "ok  " : "FAIL"} ${label.padEnd(40)} ${detail}`);

// --- LINK: internal path -------------------------------------------------
editor.commands.setTextSelection({ from: 1, to: 13 });            // "Buildon P-20"
editor.chain().focus().extendMarkRange("link").setLink({ href: "/products" }).run();
let blocks = docToBlocks(editor.getJSON());
let linked = blocks[0].runs.find((r) => r.href);
say(linked?.href === "/products", "internal link /products", linked ? JSON.stringify(linked) : "NO LINK APPLIED");

// --- LINK: external ------------------------------------------------------
editor.commands.setTextSelection({ from: 17, to: 26 });
editor.chain().focus().extendMarkRange("link").setLink({ href: "https://example.org/a" }).run();
blocks = docToBlocks(editor.getJSON());
say(blocks[0].runs.some((r) => r.href === "https://example.org/a"), "external link");

// --- LINK: javascript: must be refused -----------------------------------
editor.commands.setTextSelection({ from: 30, to: 37 });
editor.chain().focus().setLink({ href: "javascript:alert(1)" }).run();
blocks = docToBlocks(editor.getJSON());
say(!blocks[0].runs.some((r) => String(r.href).startsWith("javascript")), "javascript: refused");

// --- IMAGE: inserted with measured dimensions, as the editor now does ----
editor.commands.setTextSelection(editor.state.doc.content.size);
// measureImage() needs a real browser; this is the value it returns for a
// 900x1400 portrait, which is the case the 4:3 fallback used to ruin.
editor.chain().focus().setImage({ src: "https://x.supabase.co/storage/v1/object/public/media/a.webp", alt: "A wall", width: 900, height: 1400 }).run();
blocks = docToBlocks(editor.getJSON());
const img = blocks.find((b) => b.kind === "image");
say(!!img, "image inserted", img ? `${img.width}x${img.height} alt=${JSON.stringify(img.alt)}` : "NOT INSERTED");
if (img) say(img.width === 900 && img.height === 1400, "portrait keeps its shape",
  `${img.width}x${img.height}` + (img.width === 1600 ? "  <- 4:3 fallback, real size lost" : ""));
// alt text must be editable after the fact
editor.chain().updateAttributes("image", { alt: "A plastered wall" }).run();
const withAlt = docToBlocks(editor.getJSON()).find((b) => b.kind === "image");
say(withAlt?.alt === "A plastered wall", "alt text can be changed", JSON.stringify(withAlt?.alt));

// --- IMAGE with explicit dimensions --------------------------------------
editor.chain().focus().setImage({ src: "https://x/b.webp", alt: "B", width: 800, height: 1200 }).run();
blocks = docToBlocks(editor.getJSON());
const img2 = blocks.filter((b) => b.kind === "image").at(-1);
say(img2?.width === 800 && img2?.height === 1200, "explicit dimensions survive", img2 ? `${img2.width}x${img2.height}` : "gone");
