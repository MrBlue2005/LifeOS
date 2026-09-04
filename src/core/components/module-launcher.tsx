import Link from "next/link";

import { moduleRegistry } from "@/core/modules/registry";

export function ModuleLauncher() {
  return (
    <ul className="module-list">
      {moduleRegistry.map((moduleDefinition) => (
        <li className="module-card" key={moduleDefinition.id}>
          <Link href={moduleDefinition.href}>
            <div className="module-card-header">
              <h3>{moduleDefinition.name}</h3>
              <span className="status-label">
                {moduleDefinition.status === "available" ? "Available" : "Coming soon"}
              </span>
            </div>
            <p className="module-description">{moduleDefinition.description}</p>
            <span className="module-action" aria-hidden="true">
              Open module →
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
