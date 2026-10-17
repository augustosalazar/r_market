import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { HelperText, Menu, TextInput } from "react-native-paper";

// Un campo de solo elegir: se toca y abre la lista. Paper no trae dropdown.
export function SelectField<T>({
  label,
  value,
  options,
  onSelect,
  disabled,
  helper,
}: {
  label: string;
  value: T | null;
  options: { value: T; label: string }[];
  onSelect: (value: T) => void;
  disabled?: boolean;
  helper?: string;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value)?.label ?? "";
  return (
    <View>
      <Menu
        visible={open}
        onDismiss={() => setOpen(false)}
        anchor={
          <Pressable onPress={() => !disabled && setOpen(true)} accessibilityLabel={label} accessibilityRole="button">
            <View pointerEvents="none">
              <TextInput
                mode="outlined"
                label={label}
                value={current}
                editable={false}
                disabled={disabled}
                right={<TextInput.Icon icon="menu-down" />}
              />
            </View>
          </Pressable>
        }
      >
        {options.map((o) => (
          <Menu.Item
            key={o.label}
            title={o.label}
            onPress={() => {
              setOpen(false);
              onSelect(o.value);
            }}
          />
        ))}
      </Menu>
      {helper ? <HelperText type="info">{helper}</HelperText> : null}
    </View>
  );
}
