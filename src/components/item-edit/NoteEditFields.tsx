import { type Component } from "solid-js";
import { t } from "@/shared/i18n.ts";
import Checkbox from "@/components/Checkbox.tsx";
import FormField from "@/components/FormField.tsx";

interface NoteEditFieldsProps {
  notes: string;
  setNotes: (v: string) => void;
  reprompt: number;
  setReprompt: (v: number) => void;
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
            value={props.notes}
            onInput={(e) => props.setNotes(e.currentTarget.value)}
            placeholder={t("edit_placeholder_notes")}
          />
        </FormField>
        <div class="form-group mt-12">
          <Checkbox
            id="item-reprompt-note"
            checked={props.reprompt === 1}
            onChange={(checked) => props.setReprompt(checked ? 1 : 0)}
            label={t("edit_label_reprompt")}
          />
        </div>
      </div>
    </>
  );
};

export default NoteEditFields;
