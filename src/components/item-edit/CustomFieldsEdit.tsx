import { type Component, createSignal, For, Show } from "solid-js";
import { CustomFieldType, type VaultField } from "@/shared/types.ts";
import { DragIcon, EditIcon, PlusIcon, TrashIcon } from "@/icons/svg/index.ts";
import { t } from "@/shared/i18n.ts";
import CustomFieldModal from "@/components/CustomFieldModal.tsx";

interface CustomFieldsEditProps {
  fields: VaultField[];
  onChange: (fields: VaultField[]) => void;
}

export const CustomFieldsEdit: Component<CustomFieldsEditProps> = (props) => {
  // Drag and drop states
  const [draggedIndex, setDraggedIndex] = createSignal<number | null>(null);

  // Modal states
  const [showEditFieldModal, setShowEditFieldModal] = createSignal(false);
  const [selectedFieldIndex, setSelectedFieldIndex] = createSignal<
    number | null
  >(null);

  const initialField = () => {
    const idx = selectedFieldIndex();
    return idx === null ? null : props.fields[idx];
  };

  const handleOpenAddField = () => {
    setSelectedFieldIndex(null);
    setShowEditFieldModal(true);
  };

  const handleOpenEditField = (index: number) => {
    setSelectedFieldIndex(index);
    setShowEditFieldModal(true);
  };

  const handleSaveFieldEdit = (
    field: { name: string; value: string; type: number },
  ) => {
    const idx = selectedFieldIndex();
    if (idx === null) {
      props.onChange([...props.fields, field]);
    } else {
      props.onChange(
        props.fields.map((f, i) => (i === idx ? field : f)),
      );
    }
    setShowEditFieldModal(false);
    setSelectedFieldIndex(null);
  };

  const handleCloseFieldModal = () => {
    setShowEditFieldModal(false);
    setSelectedFieldIndex(null);
  };

  const handleDragStart = (index: number, e: DragEvent) => {
    setDraggedIndex(index);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
    }
  };

  const handleDragOver = (index: number, e: DragEvent) => {
    e.preventDefault();
    const dragged = draggedIndex();
    if (dragged === null || dragged === index) return;

    const list = [...props.fields];
    const [moved] = list.splice(dragged, 1);
    list.splice(index, 0, moved);
    props.onChange(list);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleRemoveField = (index: number) => {
    props.onChange(props.fields.filter((_, i) => i !== index));
  };

  return (
    <>
      <div class="detail-section-title">{t("edit_label_fields")}</div>
      <div class="card mb-16">
        <Show when={props.fields.length > 0}>
          <div class="mb-12">
            <For each={props.fields}>
              {(field, index) => (
                <Show
                  when={field.type === CustomFieldType.Divider}
                  fallback={
                    <div
                      draggable="true"
                      onDragStart={(e) => handleDragStart(index(), e)}
                      onDragOver={(e) => handleDragOver(index(), e)}
                      onDragEnd={handleDragEnd}
                      class={`draggable-field-row ${
                        draggedIndex() === index() ? "dragging" : ""
                      }`}
                    >
                      <div class="d-flex justify-between align-center">
                        <div class="d-flex align-center gap-6">
                          <div class="cursor-grab d-flex align-center justify-center text-muted">
                            <DragIcon class="icon-inline" />
                          </div>
                          <span class="font-w-600 font-sz-13">
                            {field.name}
                          </span>
                          <span class="field-sub-value">
                            {field.type === CustomFieldType.Hidden
                              ? "••••••••"
                              : (field.value || t("detail_no_value"))}
                          </span>
                        </div>
                        <div class="d-flex gap-8">
                          <button
                            type="button"
                            class="action-btn edit-field-btn"
                            onClick={() => handleOpenEditField(index())}
                            title={t("btn_edit")}
                          >
                            <EditIcon class="icon-inline" />
                          </button>
                          <button
                            type="button"
                            class="action-btn delete-field-btn"
                            onClick={() => handleRemoveField(index())}
                            title={t("btn_delete")}
                          >
                            <TrashIcon class="icon-inline" />
                          </button>
                        </div>
                      </div>
                    </div>
                  }
                >
                  {/* Divider Edit Row */}
                  <div
                    draggable="true"
                    onDragStart={(e) => handleDragStart(index(), e)}
                    onDragOver={(e) => handleDragOver(index(), e)}
                    onDragEnd={handleDragEnd}
                    class={`draggable-field-row ${
                      draggedIndex() === index() ? "dragging" : ""
                    }`}
                  >
                    <div class="d-flex justify-between align-center">
                      <div class="d-flex align-center gap-6 flex-1">
                        <div class="cursor-grab d-flex align-center justify-center text-muted">
                          <DragIcon class="icon-inline" />
                        </div>
                        <span class="divider-row-title">
                          {field.name}
                        </span>
                      </div>
                      <div class="d-flex gap-8">
                        <button
                          type="button"
                          class="action-btn edit-field-btn"
                          onClick={() => handleOpenEditField(index())}
                          title={t("btn_edit")}
                        >
                          <EditIcon class="icon-inline" />
                        </button>
                        <button
                          type="button"
                          class="action-btn delete-field-btn"
                          onClick={() => handleRemoveField(index())}
                          title={t("btn_delete")}
                        >
                          <TrashIcon class="icon-inline" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Show>
              )}
            </For>
          </div>
        </Show>

        <button
          type="button"
          class="add-field-btn"
          onClick={handleOpenAddField}
        >
          <PlusIcon class="icon-inline mr-4" />
          {t("edit_btn_add_field")}
        </button>
      </div>

      <CustomFieldModal
        isOpen={showEditFieldModal()}
        isEdit={selectedFieldIndex() !== null}
        initialField={initialField()}
        onClose={handleCloseFieldModal}
        onSave={handleSaveFieldEdit}
      />
    </>
  );
};

export default CustomFieldsEdit;
