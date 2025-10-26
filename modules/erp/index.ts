import React, { lazy } from 'react';
import type { ModuleConfig } from '../../types';

// FIX: Import React to correctly handle JSX syntax for the icon component.
// FIX: Converted to React.createElement because JSX syntax is not supported in .ts files.
const ErpIcon = (props: React.ComponentProps<'svg'>) => (
  React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", ...props },
    React.createElement("path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }),
    React.createElement("circle", { cx: "9", cy: "7", r: "4" }),
    React.createElement("path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }),
    React.createElement("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" })
  )
);

const ERPModule: ModuleConfig = {
  id: "erp",
  nameKey: "erp_name",
  // FIX: Add missing 'shortNameKey' property to satisfy the ModuleConfig interface.
  shortNameKey: "erp_short_name",
  component: lazy(() => import("./ErpPage")),
  enabled: true,
  api: "http://backend-erp.local/api",
  icon: ErpIcon,
};

export default ERPModule;
