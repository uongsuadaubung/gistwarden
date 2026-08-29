import { type Component, createEffect, createSignal, type JSX } from "solid-js";
import { getPathDepth } from "@/core/router.ts";
import { settingsStore } from "@/core/store.ts";

export interface RouteTransitionProps {
  children: JSX.Element;
  currentPath: string;
}

export const RouteTransition: Component<RouteTransitionProps> = (props) => {
  const [toggle, setToggle] = createSignal(false);
  const [animClass, setAnimClass] = createSignal("");
  let prevPath = props.currentPath;

  createEffect(() => {
    const currentPath = props.currentPath;
    if (currentPath !== prevPath) {
      const oldDepth = getPathDepth(prevPath);
      const newDepth = getPathDepth(currentPath);
      const isGuideTransition =
        currentPath.startsWith("/guide") || prevPath.startsWith("/guide");
      prevPath = currentPath;

      if (!settingsStore.enablePageAnimations || isGuideTransition) {
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
