import {
  type Component,
  createEffect,
  createSignal,
  type JSX,
  onCleanup,
  Show,
} from "solid-js";
import { fetchBlob } from "@/core/fetch-utils.ts";

export const Favicon: Component<{ domain: string; fallback: JSX.Element }> = (
  props,
) => {
  const [iconUrl, setIconUrl] = createSignal<string | null>(null);
  const [hasError, setHasError] = createSignal(false);

  createEffect(() => {
    const domain = props.domain;
    if (!domain) {
      setHasError(true);
      return;
    }

    const faviconUrl = `https://www.google.com/s2/favicons?domain=${
      encodeURIComponent(domain)
    }&sz=32`;

    fetchBlob(faviconUrl, { cache: "force-cache" }).then((res) => {
      if (res.isOk()) {
        const objectUrl = URL.createObjectURL(res.value);
        setIconUrl(objectUrl);
        setHasError(false);
      } else {
        setHasError(true);
      }
    });
  });

  onCleanup(() => {
    const currentUrl = iconUrl();
    if (currentUrl && currentUrl.startsWith("blob:")) {
      URL.revokeObjectURL(currentUrl);
    }
  });

  return (
    <Show when={!hasError() && iconUrl()} fallback={props.fallback}>
      <img
        src={iconUrl() || ""}
        alt=""
        onError={() => setHasError(true)}
      />
    </Show>
  );
};

export default Favicon;
