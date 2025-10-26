
import React, { LazyExoticComponent } from 'react';

export interface ModuleConfig {
  id: string;
  nameKey: string; // Key for translation
  shortNameKey: string; // Key for short name in navigation
  component: LazyExoticComponent<() => React.ReactElement> | (() => React.ReactElement) ;
  enabled: boolean;
  icon: (props: React.ComponentProps<'svg'>) => React.ReactElement;
  api?: string;
  permissions?: {
    view: UserRole[];
  };
}

export type Theme = 'light' | 'dark';

export type Language = 'en' | 'es' | 'pt';

export type UserRole = 'admin' | 'user' | 'viewer';

export interface User {
  id: string;
  username: string;
  role: UserRole;
}

export interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}
