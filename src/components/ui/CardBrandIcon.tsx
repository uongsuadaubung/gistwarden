import { type Component, Show } from "solid-js";

interface CardBrandIconProps {
  brand: string;
}

export const CardBrandIcon: Component<CardBrandIconProps> = (props) => {
  const normalized = () => props.brand.trim().toLowerCase();

  return (
    <Show
      when={normalized() === "visa"}
      fallback={
        <Show
          when={normalized() === "mastercard"}
          fallback={
            <Show
              when={normalized() === "american express" ||
                normalized() === "amex"}
              fallback={
                <div class="card-brand-fallback">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </div>
              }
            >
              <div class="amex-logo">
                <span>AMEX</span>
              </div>
            </Show>
          }
        >
          <div class="mastercard-logo">
            <span class="mc-circle mc-circle-left" />
            <span class="mc-circle mc-circle-right" />
          </div>
        </Show>
      }
    >
      <div class="visa-logo">
        <span>VISA</span>
      </div>
    </Show>
  );
};

export default CardBrandIcon;
