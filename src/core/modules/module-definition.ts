export type ModuleStatus = "coming-soon";

export type LifeOSModuleDefinition = Readonly<{
  id: string;
  name: string;
  description: string;
  href: `/${string}`;
  status: ModuleStatus;
}>;
