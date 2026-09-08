"use client";

type DatePreset = Readonly<{ label: string; value: string }>;

export function ReconsiderationPresetButtons({
  presets,
  value,
  onChange,
  compact = false,
}: Readonly<{
  presets: readonly DatePreset[];
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}>) {
  return (
    <div
      aria-label="Reconsideration presets"
      className={`date-presets${compact ? " compact-presets" : ""}`}
      role="group"
    >
      {presets.map((preset) => (
        <button
          aria-pressed={value === preset.value}
          key={preset.label}
          onClick={() => onChange(preset.value)}
          type="button"
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}

export function ReconsiderationDateControl({
  label,
  presets,
  value,
  onChange,
  min,
  describedBy,
  invalid = false,
  compact = false,
  presetsFirst = false,
}: Readonly<{
  label: string;
  presets: readonly DatePreset[];
  value: string;
  onChange: (value: string) => void;
  min?: string;
  describedBy?: string;
  invalid?: boolean;
  compact?: boolean;
  presetsFirst?: boolean;
}>) {
  const presetButtons = (
    <ReconsiderationPresetButtons compact={compact} onChange={onChange} presets={presets} value={value} />
  );
  const dateInput = (
    <label className="field">
      <span>{label}</span>
      <input
        aria-describedby={describedBy}
        aria-invalid={invalid}
        min={min}
        name="reconsiderAt"
        onChange={(event) => onChange(event.target.value)}
        required
        type="date"
        value={value}
      />
    </label>
  );
  return presetsFirst
    ? <>{presetButtons}{dateInput}</>
    : <>{dateInput}{presetButtons}</>;
}
