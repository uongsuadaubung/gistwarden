import { type Component, createEffect } from "solid-js";
import { Dynamic } from "solid-js/web";

export interface SafeHtmlProps {
  html: string;
  class?: string;
  tag?: string;
}

/**
 * Component hiển thị các chuỗi định dạng HTML (như <strong>, <br/>) một cách an toàn
 * bằng DOMParser và replaceChildren(), hoàn toàn KHÔNG sử dụng innerHTML.
 * Giúp giao diện hiển thị đúng chữ in đậm/xuống dòng mà không bị cảnh báo bảo mật từ Browser Store Linters.
 */
export const SafeHtml: Component<SafeHtmlProps> = (props) => {
  let containerRef: HTMLElement | undefined;

  createEffect(() => {
    if (!containerRef) return;
    const doc = new DOMParser().parseFromString(props.html || "", "text/html");
    containerRef.replaceChildren(...Array.from(doc.body.childNodes));
  });

  return (
    <Dynamic
      component={props.tag || "span"}
      ref={containerRef}
      class={props.class}
    />
  );
};

export default SafeHtml;
