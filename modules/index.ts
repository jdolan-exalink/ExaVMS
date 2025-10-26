
import ServerConfig from "./server-config";
import LiveView from "./liveview";
import LPR from "./lpr";
import Traffic from "./traffic";
import EventsModule from "./events";
import { ModuleConfig } from "../types";

// Order defines the navigation order
export const modules: ModuleConfig[] = [
  LiveView,
  EventsModule,
  LPR,
  Traffic,
  ServerConfig,
];
