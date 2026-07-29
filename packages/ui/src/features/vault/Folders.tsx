import { type Component, createSignal, For } from "solid-js";
import { accountStore } from "@/core/store.ts";
import { View } from "@/core/types.ts";
import { type Folder } from "@gistwarden/domain";
import { navigate } from "@/core/navigation.ts";
import {
  addFolder,
  deleteFolder,
  renameFolder,
} from "@/features/vault/vault-service.ts";
import { setGlobalLoading, showToast } from "@gistwarden/ui";
import DetailHeader from "@/components/ui/DetailHeader.tsx";
import FolderModal from "@/components/ui/FolderModal.tsx";
import Button from "@/components/ui/Button.tsx";
import { EditIcon, PlusIcon } from "@/icons/svg/index.ts";
import { t } from "@/core/i18n.ts";

export const Folders: Component = () => {
  const [showFolderModal, setShowFolderModal] = createSignal(false);
  const [editingFolder, setEditingFolder] = createSignal<Folder | null>(null);

  const handleBack = () => {
    navigate(View.VaultOptions);
  };

  const handleEditFolder = (folder: Folder) => {
    setEditingFolder(folder);
    setShowFolderModal(true);
  };

  const handleNewFolder = () => {
    setEditingFolder(null);
    setShowFolderModal(true);
  };

  const handleSaveFolder = async (name: string): Promise<boolean> => {
    const current = editingFolder();
    setGlobalLoading(true);
    let res;
    if (current) {
      res = await renameFolder(current.id, name);
    } else {
      res = await addFolder(name);
    }
    setGlobalLoading(false);

    if (res.isOk()) {
      showToast(
        current ? t("folder_rename_success") : t("folder_add_success"),
        "success",
      );
      setShowFolderModal(false);
      setEditingFolder(null);
      return true;
    } else {
      showToast(t(res.error), "error");
      return false;
    }
  };

  const handleDeleteFolder = async (folderId: string): Promise<boolean> => {
    setGlobalLoading(true);
    const res = await deleteFolder(folderId);
    setGlobalLoading(false);

    if (res.isOk()) {
      showToast(t("folder_delete_success"), "success");
      setShowFolderModal(false);
      setEditingFolder(null);
      return true;
    } else {
      showToast(t(res.error), "error");
      return false;
    }
  };

  return (
    <div class="app-container">
      <div class="app-body">
        {/* Header */}
        <DetailHeader
          title={t("folder_management_title")}
          onBack={handleBack}
          showPopout={false}
          rightActions={
            <Button
              variant="primary"
              onClick={handleNewFolder}
              class="d-flex align-items-center gap-4 py-4 px-12"
            >
              <PlusIcon class="icon-inline" />
              <span>New</span>
            </Button>
          }
        />

        <div class="card card-list">
          <For
            each={accountStore.folders || []}
            fallback={
              <div class="p-16 text-center text-muted font-sz-13">
                {t("vault_empty_subtitle")}
              </div>
            }
          >
            {(folder) => (
              <div
                class="setting-row"
                onClick={() => handleEditFolder(folder)}
              >
                <div class="setting-row-left">
                  <div class="setting-label font-w-500">{folder.name}</div>
                </div>
                <button
                  type="button"
                  class="action-btn p-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditFolder(folder);
                  }}
                  title={t("btn_edit")}
                >
                  <EditIcon class="icon-inline" />
                </button>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Modal */}
      <FolderModal
        isOpen={showFolderModal()}
        folder={editingFolder()}
        onClose={() => {
          setShowFolderModal(false);
          setEditingFolder(null);
        }}
        onSave={handleSaveFolder}
        onDelete={handleDeleteFolder}
      />
    </div>
  );
};

export default Folders;
