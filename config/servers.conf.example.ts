
import type { Server } from './serverConfig';

// This file serves as the default global configuration.
// User changes will be persisted in localStorage.
export const servers: Server[] = [
    { 
        id: 'casa', 
        name: 'Casa Frigate (Direct)', 
        url: 'http://10.1.1.252:5000', 
        enabled: true,
        auth: {
            type: 'none'
        }
    },
    { 
        id: 'casa_auth', 
        name: 'Casa Frigate (Auth)', 
        url: 'https://10.1.1.252:8971', 
        enabled: false,
        auth: {
            type: 'frigate',
            username: 'juan',
            password: 'daytona1309'
        }
    }
];
