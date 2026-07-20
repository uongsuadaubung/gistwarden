import {
  type Component,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from "solid-js";

export interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps {
  id?: string;
  value?: string | number;
  onChange?: (
    e: { currentTarget: { value: string }; target: { value: string } },
  ) => void;
  options: SelectOption[];
  class?: string;
  disabled?: boolean;
}

export const Select: Component<SelectProps> = (props) => {
  const [isOpen, setIsOpen] = createSignal(false);
  let containerRef: HTMLDivElement | undefined;

  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target;
    if (
      containerRef && target instanceof Node && !containerRef.contains(target)
    ) {
      setIsOpen(false);
    }
  };

  onMount(() => {
    document.addEventListener("click", handleClickOutside);
  });

  onCleanup(() => {
    document.removeEventListener("click", handleClickOutside);
  });

  const selectedOption = () => {
    return props.options.find((opt) =>
      String(opt.value) === String(props.value)
    ) || props.options[0];
  };

  const handleSelect = (val: string | number) => {
    setIsOpen(false);
    if (props.onChange) {
      props.onChange({
        currentTarget: { value: String(val) },
        target: { value: String(val) },
      });
    }
  };

  return (
    <div
      ref={containerRef}
      class={`select-container ${props.class || ""}`}
      id={props.id}
    >
      <button
        type="button"
        class="select-control d-flex align-center justify-between"
        onClick={() => !props.disabled && setIsOpen(!isOpen())}
        disabled={props.disabled}
      >
        <span class="select-value">{selectedOption()?.label || ""}</span>
        <div class={`select-arrow ${isOpen() ? "open" : ""}`}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      <Show when={isOpen()}>
        <div class="select-dropdown-options">
          <For each={props.options}>
            {(opt) => (
              <div
                class={`select-dropdown-item ${
                  String(opt.value) === String(props.value) ? "selected" : ""
                }`}
                onClick={() => handleSelect(opt.value)}
              >
                {opt.label}
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};

export default Select;
