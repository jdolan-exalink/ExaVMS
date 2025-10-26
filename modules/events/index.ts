
import React, { lazy } from 'react';
import type { ModuleConfig } from '../../types';

const EventsIcon = (props: React.ComponentProps<'svg'>) => (
  React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", ...props },
    React.createElement("rect", { x: "2", y: "2", width: "20", height: "20", rx: "2.18", ry: "2.18" }),
    React.createElement("line", { x1: "7", y1: "2", x2: "7", y2: "22" }),
    React.createElement("line", { x1: "17", y1: "2", x2: "17", y2: "22" }),
    React.createElement("line", { x1: "2", y1: "12", x2: "22", y2: "12" }),
    React.createElement("line", { x1: "2", y1: "7", x2: "7", y2: "7" }),
    React.createElement("line", { x1: "2", y1: "17", x2: "7", y2: "17" }),
    React.createElement("line", { x1: "17", y1: "17", x2: "22", y2: "17" }),
    React.createElement("line", { x1: "17", y1: "7", x2: "22", y2: "7" })
  )
);

const EventsModule: ModuleConfig = {
  id: "events",
  nameKey: "events_name",
  shortNameKey: "events_short_name",
  component: lazy(() => import("./EventsPage")),
  enabled: true,
  icon: EventsIcon,
  permissions: {
    view: ["admin", "user"],
  },
};

export default EventsModule;
