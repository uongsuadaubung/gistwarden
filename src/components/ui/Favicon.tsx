import { type Component, createSignal, type JSX, Show } from "solid-js";

export const Favicon: Component<{ domain: string; fallback: JSX.Element }> = (
  props,
) => {
  const [hasError, setHasError] = createSignal(false);
  return (
    <Show when={!hasError()} fallback={props.fallback}>
      <img
        src={`https://www.google.com/s2/favicons?domain=${props.domain}&sz=32`}
        alt=""
        onError={() => setHasError(true)}
      />
    </Show>
  );
};
export default Favicon;
