import { type Component } from "solid-js";
import { t } from "@/core/i18n.ts";
import Checkbox from "@/components/ui/Checkbox.tsx";
import FormField from "@/components/ui/FormField.tsx";
import type { ItemEditFormState } from "@/features/vault/item-edit/vault-edit-helper.ts";

interface NoteEditFieldsProps {
  formState: ItemEditFormState;
  updateForm: <K extends keyof ItemEditFormState>(
    key: K,
    val: ItemEditFormState[K],
  ) => void;
}

export const NoteEditFields: Component<NoteEditFieldsProps> = (props) => {
  return (
    <>
      <div class="detail-section-title mt-0">{t("edit_label_notes")}</div>
      <div class="card mb-16">
        <FormField id="item-notes" label="">
          <textarea
            id="item-notes"
            class="input-control"
            rows="8"
            value={props.formState.notes}
            onInput={(e) => props.updateForm("notes", e.currentTarget.value)}
            placeholder={t("edit_placeholder_notes")}
          />
        </FormField>
        <div class="form-group mt-12">
          <Checkbox
            id="item-reprompt-note"
            checked={props.formState.reprompt === 1}
            onChange={(checked) =>
              props.updateForm("reprompt", checked ? 1 : 0)}
            label={t("edit_label_reprompt")}
          />
        </div>
      </div>
    </>
  );
};

export default NoteEditFields;
