import { type Component } from "solid-js";
import { type SecureNoteVaultItem } from "@/shared/types.ts";
import { t } from "@/shared/i18n.ts";

interface NoteDetailFieldsProps {
  item: SecureNoteVaultItem;
}

export const NoteDetailFields: Component<NoteDetailFieldsProps> = (props) => {
  return (
    <>
      <div class="detail-section-title mt-0">
        {t("edit_label_notes")}
      </div>
      <div class="card mb-16">
        <div class="notes-display">
          {props.item.notes || t("detail_no_value")}
        </div>
      </div>
    </>
  );
};

export default NoteDetailFields;
