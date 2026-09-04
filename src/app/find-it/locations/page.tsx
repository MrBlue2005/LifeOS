import type { Metadata } from "next";

import {
  FindItConfigurationRequired,
  LocationsScreen,
  requireFindItUser,
} from "@/modules/find-it";

export const metadata: Metadata = {
  title: "Locations · Find It",
};

export const dynamic = "force-dynamic";

type LocationsPageProps = Readonly<{
  searchParams: Promise<{ notice?: string }>;
}>;

export default async function LocationsPage({ searchParams }: LocationsPageProps) {
  const user = await requireFindItUser("/find-it/locations");

  if (!user) {
    return <FindItConfigurationRequired />;
  }

  return (
    <LocationsScreen
      notice={(await searchParams).notice}
      userId={user.id}
    />
  );
}
