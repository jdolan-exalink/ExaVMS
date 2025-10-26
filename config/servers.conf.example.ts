
import type { Server } from './serverConfig';

// This file serves as the default global configuration.
// User changes will be persisted in localStorage.
export const servers: Server[] = [
    { 
        id: 'server1', 
        name: 'Frigate Server', 
        url: 'http://10.1.1.252:5000', 
        token: '',
        enabled: true 
    },
];
