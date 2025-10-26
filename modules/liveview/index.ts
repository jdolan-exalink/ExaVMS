
import React, { lazy } from 'react';
import type { ModuleConfig } from '../../types';

const LiveViewIcon = (props: React.ComponentProps<'svg'>) => (
    React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", ...props },
        React.createElement("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }),
        React.createElement("line", { x1: "3", y1: "9", x2: "21", y2: "9" }),
        React.createElement("line", { x1: "9", y1: "21", x2: "9", y2: "9" })
    )
);

const LiveViewModule: ModuleConfig = {
  id: "liveview",
  nameKey: "liveview_name",
  shortNameKey: "liveview_short_name",
  component: lazy(() => import("./LiveViewPage")),
  enabled: true,
  icon: LiveViewIcon,
  permissions: {
    view: ["admin", "user", "viewer"],
  },
};

export default LiveViewModule;
