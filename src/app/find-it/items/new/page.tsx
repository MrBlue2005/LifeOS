import type { Metadata } from "next";

import {
  FindItConfigurationRequired,
  NewItemScreen,
  requireFindItUser,
} from "@/modules/find-it";

export const metadata: Metadata = {
  title: "Add item · Find It",
};

export const dynamic = "force-dynamic";

export default async function NewItemPage() {
  const user = await requireFindItUser("/find-it/items/new");

  if (!user) {
    return <FindItConfigurationRequired />;
  }

  return <NewItemScreen userId={user.id} />;
}
