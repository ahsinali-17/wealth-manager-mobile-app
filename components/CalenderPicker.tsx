import React from "react";
import DatePicker, { useDefaultStyles } from "react-native-ui-datepicker";

export default function CalenderPicker({
  onChange,
  value,
  maximumDate,
}: {
  onChange: (date: Date) => void;
  value: Date;
  maximumDate?: Date;
}) {
  const defaultDisplay = useDefaultStyles("light");
  return (
    <DatePicker
      mode="single"
      date={value}
      onChange={({ date }) => {
        date && onChange(new Date(date as any));
      }}
      maxDate={maximumDate}
      styles={{
        ...defaultDisplay,
      }}
    />
  );
}
