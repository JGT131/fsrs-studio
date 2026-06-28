// V1.9 — SEO head manager. Sets document.title, description meta,
// canonical link, OpenGraph tags, and optional JSON-LD schema blocks
// without requiring react-helmet. Cleans up tags it added on unmount
// so each route gets a fresh set.
import { useEffect } from "react";

const MANAGED_ATTR = "data-fsrs-seo";

function setMeta(name, content, attr = "name") {
    if (!content) return null;
    // Prefer adopting an existing tag (managed or not) to avoid duplicates
    // with whatever was statically shipped in public/index.html.
    const managedSel = `meta[${attr}="${name}"][${MANAGED_ATTR}]`;
    const anySel = `meta[${attr}="${name}"]`;
    let tag =
        document.head.querySelector(managedSel) ||
        document.head.querySelector(anySel);
    if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attr, name);
        document.head.appendChild(tag);
    }
    tag.setAttribute(MANAGED_ATTR, "1");
    tag.setAttribute("content", content);
    return tag;
}

function setCanonical(href) {
    if (!href) return null;
    let tag =
        document.head.querySelector(`link[rel="canonical"][${MANAGED_ATTR}]`) ||
        document.head.querySelector(`link[rel="canonical"]`);
    if (!tag) {
        tag = document.createElement("link");
        tag.setAttribute("rel", "canonical");
        document.head.appendChild(tag);
    }
    tag.setAttribute(MANAGED_ATTR, "1");
    tag.setAttribute("href", href);
    return tag;
}

function appendJsonLd(id, payload) {
    if (!payload) return null;
    let tag = document.head.querySelector(
        `script[type="application/ld+json"][${MANAGED_ATTR}="${id}"]`,
    );
    if (!tag) {
        tag = document.createElement("script");
        tag.type = "application/ld+json";
        tag.setAttribute(MANAGED_ATTR, id);
        document.head.appendChild(tag);
    }
    tag.textContent = JSON.stringify(payload);
    return tag;
}

export default function SeoHead({
    title,
    description,
    canonical,
    keywords,
    ogTitle,
    ogDescription,
    ogType = "website",
    ogImage,
    jsonLd, // either a single object or an array of {id, data}
}) {
    useEffect(() => {
        const created = [];

        if (title) {
            document.title = title;
        }
        created.push(setMeta("description", description));
        if (keywords) created.push(setMeta("keywords", keywords));

        created.push(setMeta("og:title", ogTitle || title, "property"));
        created.push(setMeta("og:description", ogDescription || description, "property"));
        created.push(setMeta("og:type", ogType, "property"));
        if (ogImage) created.push(setMeta("og:image", ogImage, "property"));

        created.push(setMeta("twitter:card", "summary_large_image"));
        created.push(setMeta("twitter:title", ogTitle || title));
        created.push(setMeta("twitter:description", ogDescription || description));

        if (canonical) {
            const fullCanonical = canonical.startsWith("http")
                ? canonical
                : `${window.location.origin}${canonical}`;
            created.push(setCanonical(fullCanonical));
            created.push(setMeta("og:url", fullCanonical, "property"));
        }

        const ldEntries = Array.isArray(jsonLd)
            ? jsonLd
            : jsonLd
              ? [{ id: "default", data: jsonLd }]
              : [];
        const ldTags = ldEntries.map((e) => appendJsonLd(e.id, e.data));

        return () => {
            // Remove only the tags we manage that match the JSON-LD we created;
            // meta/canonical are reused across route changes (overwritten).
            ldTags.forEach((t) => {
                if (t && t.parentNode) t.parentNode.removeChild(t);
            });
            // Also drop ldTags whose ids existed in previous route but not this
            // one — handled by the next route re-running this effect, which
            // overwrites by id.
        };
    }, [title, description, canonical, keywords, ogTitle, ogDescription, ogType, ogImage, JSON.stringify(jsonLd)]);

    return null;
}
