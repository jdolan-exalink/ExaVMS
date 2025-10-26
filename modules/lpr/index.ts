
import React, { lazy } from 'react';
import type { ModuleConfig } from '../../types';

const LprIcon = (props: React.ComponentProps<'svg'>) => (
  React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", ...props },
    React.createElement("rect", { x: "2", y: "4", width: "20", height: "16", rx: "2" }),
    React.createElement("path", { d: "M8 10h.01" }),
    React.createElement("path", { d: "M12 10h.01" }),
    React.createElement("path", { d: "M16 10h.01" }),
    React.createElement("path", { d: "M8 14h8" })
  )
);

const LPRModule: ModuleConfig = {
  id: "lpr",
  nameKey: "lpr_name",
  shortNameKey: "lpr_short_name",
  component: lazy(() => import("./LprPage")),
  enabled: true,
  icon: LprIcon,
  permissions: {
    view: ["admin", "user"],
  }
};

export default LPRModule;
