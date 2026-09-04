import type { Metadata } from "next";

import {
  FindItConfigurationRequired,
  FindItHomeScreen,
  findItModule,
  requireFindItUser,
} from "@/modules/find-it";

export const metadata: Metadata = {
  title: findItModule.name,
  description: findItModule.description,
};

export const dynamic = "force-dynamic";

type FindItPageProps = Readonly<{
  searchParams: Promise<{ notice?: string; q?: string }>;
}>;

export default async function FindItPage({ searchParams }: FindItPageProps) {
  const user = await requireFindItUser("/find-it");

  if (!user) {
    return <FindItConfigurationRequired />;
  }

  const { notice, q } = await searchParams;
  return <FindItHomeScreen notice={notice} rawQuery={q} userId={user.id} />;
}
