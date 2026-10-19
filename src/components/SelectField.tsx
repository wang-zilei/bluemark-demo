import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

const ALL_VALUE = "__all__";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export function SelectField({
  value,
  options,
  onChange,
  ariaLabel,
  placeholder = "请选择",
  className = "",
}: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <Select.Root
      value={value || ALL_VALUE}
      onValueChange={(next) => onChange(next === ALL_VALUE ? "" : next)}
    >
      <Select.Trigger
        className={`ui-select-trigger ${className}`.trim()}
        aria-label={ariaLabel}
      >
        <Select.Value placeholder={placeholder} />
        <Select.Icon className="ui-select-icon">
          <ChevronDown size={16} />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          className="ui-select-content"
          position="popper"
          sideOffset={7}
          collisionPadding={12}
          avoidCollisions
        >
          <Select.ScrollUpButton className="ui-select-scroll">
            <ChevronUp size={14} />
          </Select.ScrollUpButton>
          <Select.Viewport className="ui-select-viewport">
            {options.map((option) => (
              <Select.Item
                className="ui-select-item"
                key={option.value || ALL_VALUE}
                value={option.value || ALL_VALUE}
                disabled={option.disabled}
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator className="ui-select-check">
                  <Check size={15} />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
          <Select.ScrollDownButton className="ui-select-scroll">
            <ChevronDown size={14} />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

export function optionsFromValues(values: readonly string[], allLabel: string): SelectOption[] {
  return [
    { value: "", label: allLabel },
    ...values.map((value) => ({ value, label: value })),
  ];
}
