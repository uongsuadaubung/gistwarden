import { render } from "solid-js/web";
import { RepromptModal } from "@gistwarden/ui";

function WebApp() {
  return (
    <div class="web-app-container flex h-screen w-screen bg-neutral-900 text-neutral-100 overflow-hidden items-center justify-center">
      <div class="text-center p-8 bg-neutral-800 rounded-xl shadow-2xl border border-neutral-700 max-w-md">
        <h1 class="text-2xl font-bold mb-4 text-emerald-400">
          Gistwarden Web Vault
        </h1>
        <p class="text-neutral-400 mb-6">
          Shared SolidJS UI Engine (@gistwarden/ui) loaded successfully!
        </p>
      </div>
      <RepromptModal />
    </div>
  );
}

const root = document.getElementById("root");
if (root) {
  render(() => <WebApp />, root);
}
