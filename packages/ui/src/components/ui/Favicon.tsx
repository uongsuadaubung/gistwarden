import {
  type Component,
  createEffect,
  createSignal,
  type JSX,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { fetchBlob } from "@/core/fetch-utils.ts";

// Global cache to avoid duplicate network requests across items with identical domains
const faviconCache = new Map<string, string>();
const faviconFailedSet = new Set<string>();

export const Favicon: Component<{ domain: string; fallback: JSX.Element }> = (
  props,
) => {
  let containerRef: HTMLSpanElement | undefined;
  const [iconUrl, setIconUrl] = createSignal<string | null>(null);
  const [hasError, setHasError] = createSignal(false);
  const [isVisible, setIsVisible] = createSignal(false);

  onMount(() => {
    if (!containerRef || typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "50px", // Load 50px before entering viewport
      },
    );

    observer.observe(containerRef);

    onCleanup(() => {
      observer.disconnect();
    });
  });

  createEffect(() => {
    const domain = props.domain;
    if (!domain) {
      setHasError(true);
      return;
    }

    if (faviconFailedSet.has(domain)) {
      setHasError(true);
      return;
    }

    const cached = faviconCache.get(domain);
    if (cached) {
      setIconUrl(cached);
      setHasError(false);
      return;
    }

    // Lazy load: Only fetch network resource when scrolled into viewport
    if (!isVisible()) return;

    const faviconUrl = `https://www.google.com/s2/favicons?domain=${
      encodeURIComponent(domain)
    }&sz=32`;

    fetchBlob(faviconUrl, { cache: "force-cache" }).then((res) => {
      if (res.isOk()) {
        const objectUrl = URL.createObjectURL(res.value);
        faviconCache.set(domain, objectUrl);
        setIconUrl(objectUrl);
        setHasError(false);
      } else {
        faviconFailedSet.add(domain);
        setHasError(true);
      }
    });
  });

  return (
    <span ref={containerRef} class="favicon-wrapper">
      <Show when={!hasError() && iconUrl()} fallback={props.fallback}>
        <img
          src={iconUrl() || ""}
          alt=""
          onError={() => {
            if (props.domain) faviconFailedSet.add(props.domain);
            setHasError(true);
          }}
        />
      </Show>
    </span>
  );
};

export default Favicon;
