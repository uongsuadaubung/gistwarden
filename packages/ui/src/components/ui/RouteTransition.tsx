import { type Component, createEffect, createSignal, type JSX } from "solid-js";
import { useLocation } from "@solidjs/router";
import { getPathDepth } from "@/core/router.ts";
import { settingsStore } from "@/core/store.ts";

export const RouteTransition: Component<{ children: JSX.Element }> = (
  props,
) => {
  const location = useLocation();
  const [toggle, setToggle] = createSignal(false);
  const [animClass, setAnimClass] = createSignal("");
  let prevPath = location.pathname;

  createEffect(() => {
    const currentPath = location.pathname;
    if (currentPath !== prevPath) {
      const oldDepth = getPathDepth(prevPath);
      const newDepth = getPathDepth(currentPath);
      prevPath = currentPath;

      if (!settingsStore.enablePageAnimations) {
        setAnimClass("");
        return;
      }

      const nextToggle = !toggle();
      setToggle(nextToggle);
      const suffix = nextToggle ? "a" : "b";

      if (newDepth > oldDepth) {
        setAnimClass(`slide-forward-${suffix}`);
      } else if (newDepth < oldDepth) {
        setAnimClass(`slide-backward-${suffix}`);
      } else {
        setAnimClass(`fade-in-${suffix}`);
      }
    }
  });

  return (
    <div class={`${animClass()} h-100 w-100 pos-relative overflow-hidden`}>
      {props.children}
    </div>
  );
};
