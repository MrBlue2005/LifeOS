import type { Metadata } from "next";

import {
  FindItConfigurationRequired,
  ItemDetailScreen,
  requireFindItUser,
} from "@/modules/find-it";

export const metadata: Metadata = {
  title: "Item · Find It",
};

export const dynamic = "force-dynamic";

type ItemPageProps = Readonly<{
  params: Promise<{ itemId: string }>;
  searchParams: Promise<{ notice?: string }>;
}>;

export default async function ItemPage({ params, searchParams }: ItemPageProps) {
  const { itemId } = await params;
  const user = await requireFindItUser(`/find-it/items/${itemId}`);

  if (!user) {
    return <FindItConfigurationRequired />;
  }

  return (
    <ItemDetailScreen
      itemId={itemId}
      notice={(await searchParams).notice}
      userId={user.id}
    />
  );
}
