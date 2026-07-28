import { type Component, createSignal, For, onMount, Show } from "solid-js";
import DetailHeader from "@/components/ui/DetailHeader.tsx";
import { formatDateTime, t } from "@/core/i18n.ts";
import { navigate } from "@/core/navigation.ts";
import { View } from "@/core/types.ts";
import type { GeneratedPasswordHistoryItem } from "@gistwarden/repository";
import { clearPasswordHistory, getPasswordHistory } from "@/core/storage.ts";
import { CopyIcon, TrashIcon } from "@/icons/svg/index.ts";
import { confirm, copyToClipboardWithMessage } from "@gistwarden/ui";

export const PasswordHistory: Component = () => {
  const [historyItems, setHistoryItems] = createSignal<
    GeneratedPasswordHistoryItem[]
  >([]);
  const [copiedIndex, setCopiedIndex] = createSignal<number | null>(null);

  const loadHistory = async () => {
    const res = await getPasswordHistory();
    if (res.isOk()) {
      setHistoryItems(res.value);
    }
  };

  onMount(() => {
    loadHistory();
  });

  const handleCopyItem = async (pwd: string, index: number) => {
    await copyToClipboardWithMessage(pwd, "history_copied_toast");
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClearHistory = async () => {
    const isConfirmed = await confirm(
      t("history_clear_btn"),
      t("history_confirm_clear_msg"),
      "danger",
    );
    if (!isConfirmed) return;
    await clearPasswordHistory();
    setHistoryItems([]);
  };

  return (
    <div class="app-container">
      <div class="app-body">
        <DetailHeader
          title={t("history_title")}
          onBack={() => navigate(View.Generator)}
        />

        <Show
          when={historyItems().length > 0}
          fallback={
            <div class="text-center py-12 text-muted">
              {t("history_empty")}
            </div>
          }
        >
          <div class="flex-col gap-12 mb-16">
            <For each={historyItems()}>
              {(item, index) => (
                <div class="card p-12 overflow-visible">
                  <div class="justify-between align-center mb-8">
                    <div class="font-sz-12 text-muted">
                      {item.domain ? item.domain : "N/A"}
                    </div>
                    <div class="font-sz-11 text-muted">
                      {formatDateTime(item.copiedAt)}
                    </div>
                  </div>
                  <div class="justify-between align-center gap-8">
                    <div class="font-sz-14 font-w-600 word-break-all font-mono">
                      {item.password}
                    </div>
                    <button
                      type="button"
                      class={`action-btn flex-shrink-0 ${
                        copiedIndex() === index() ? "copied" : ""
                      }`}
                      onClick={() => handleCopyItem(item.password, index())}
                      title={copiedIndex() === index()
                        ? t("btn_copied")
                        : t("btn_copy")}
                    >
                      <CopyIcon />
                    </button>
                  </div>
                </div>
              )}
            </For>
          </div>

          <div class="mt-24 pt-16 mb-16 border-top text-center">
            <button
              type="button"
              class="btn btn-secondary btn-block"
              onClick={handleClearHistory}
            >
              <TrashIcon class="icon-inline" />
              <span>{t("history_clear_btn")}</span>
            </button>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default PasswordHistory;
