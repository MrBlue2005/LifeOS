const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ValidationSuccess<T> = Readonly<{ success: true; data: T }>;
type ValidationFailure = Readonly<{
  success: false;
  message: string;
  values: Readonly<Record<string, string>>;
}>;

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

export type LocationInput = Readonly<{
  name: string;
  parentId: string | null;
}>;

export type ItemInput = Readonly<{
  name: string;
  description: string | null;
  locationId: string;
}>;

function readText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function isUuid(value: string): boolean {
  return uuidPattern.test(value);
}

export function validateLocationInput(
  formData: FormData,
): ValidationResult<LocationInput> {
  const name = readText(formData, "name");
  const parentValue = readText(formData, "parentId");
  const values = { name, parentId: parentValue };

  if (!name) {
    return { success: false, message: "Location name is required.", values };
  }

  if (name.length > 100) {
    return {
      success: false,
      message: "Location name must be 100 characters or fewer.",
      values,
    };
  }

  if (parentValue && !isUuid(parentValue)) {
    return { success: false, message: "Choose a valid parent location.", values };
  }

  return {
    success: true,
    data: { name, parentId: parentValue || null },
  };
}

export function validateItemInput(
  formData: FormData,
): ValidationResult<ItemInput> {
  const name = readText(formData, "name");
  const descriptionValue = readText(formData, "description");
  const locationId = readText(formData, "locationId");
  const values = { name, description: descriptionValue, locationId };

  if (!name) {
    return { success: false, message: "Item name is required.", values };
  }

  if (name.length > 120) {
    return {
      success: false,
      message: "Item name must be 120 characters or fewer.",
      values,
    };
  }

  if (descriptionValue.length > 500) {
    return {
      success: false,
      message: "Description must be 500 characters or fewer.",
      values,
    };
  }

  if (!isUuid(locationId)) {
    return { success: false, message: "Choose a valid location.", values };
  }

  return {
    success: true,
    data: {
      name,
      description: descriptionValue || null,
      locationId,
    },
  };
}

export function normalizeSearchQuery(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ").slice(0, 100);
}

export function toIlikeContainsPattern(value: string): string {
  const escaped = value.replace(/[\\%_]/g, "\\$&");
  return `%${escaped}%`;
}
