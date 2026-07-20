import { type Component, type JSX } from "solid-js";

interface FormFieldProps {
  id: string;
  label: string;
  children: JSX.Element;
  class?: string;
}

export const FormField: Component<FormFieldProps> = (props) => {
  return (
    <div class={`form-group ${props.class || ""}`.trim()}>
      <label for={props.id}>{props.label}</label>
      {props.children}
    </div>
  );
};

export default FormField;
