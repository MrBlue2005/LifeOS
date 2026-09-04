export type FindItLocation = Readonly<{
  id: string;
  userId: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}>;

export type FindItItem = Readonly<{
  id: string;
  userId: string;
  name: string;
  description: string | null;
  locationId: string;
  createdAt: string;
  updatedAt: string;
}>;

export type LocationTreeEntry = Readonly<{
  location: FindItLocation;
  depth: number;
  path: readonly string[];
}>;

export type FindItItemResult = Readonly<{
  item: FindItItem;
  locationPath: readonly string[];
}>;

export type FindItActionState = Readonly<{
  status: "idle" | "error";
  message: string;
  values: Readonly<Record<string, string>>;
}>;

export const initialFindItActionState: FindItActionState = {
  status: "idle",
  message: "",
  values: {},
};
