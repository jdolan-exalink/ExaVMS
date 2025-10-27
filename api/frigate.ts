
// Módulo centralizado para conexión a Frigate v0.16
// Soporta autenticación (cookie/token)

export interface FrigateConfig {
  baseUrl: string;
  authType?: 'cookie' | 'token' | 'none';
  username?: string;
  password?: string;
  token?: string;
}

class FrigateAPI {
  private baseUrl: string;
  private config: FrigateConfig;

  constructor(config: FrigateConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl;
  }

  async login(): Promise<void> {
    if (this.config.authType === 'cookie' && this.config.username && this.config.password) {
      const res = await fetch(`${this.baseUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: this.config.username, password: this.config.password }),
        credentials: 'include',
      });
      // No need to manually handle cookies, browser does it with credentials: 'include'
    }
  }

  async getCameras(): Promise<any[]> {
    const res = await fetch(`${this.baseUrl}/api/config`, {
      credentials: 'include',
    });
    const data = await res.json();
    return Object.values(data.cameras || {});
  }

  async getVersion(): Promise<any> {
    const res = await fetch(`${this.baseUrl}/api/version`, {
      credentials: 'include',
    });
    return await res.json();
  }

  async getServerStatus(): Promise<any> {
    const res = await fetch(`${this.baseUrl}/api/stats`, {
      credentials: 'include',
    });
    return await res.json();
  }

  async getEvents(params?: Record<string, any>): Promise<any[]> {
    const url = new URL(`${this.baseUrl}/api/events`);
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, String(v)));
    const res = await fetch(url.toString(), {
      credentials: 'include',
    });
    return await res.json();
  }

  async searchEvents(params: Record<string, any>): Promise<any[]> {
    const url = new URL(`${this.baseUrl}/api/events/search`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, String(v)));
    const res = await fetch(url.toString(), {
      credentials: 'include',
    });
    return await res.json();
  }

  async getEventDetails(eventId: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/api/events/${eventId}`, {
      credentials: 'include',
    });
    return await res.json();
  }

  async getEventSnapshot(eventId: string): Promise<Blob> {
    const res = await fetch(`${this.baseUrl}/api/events/${eventId}/snapshot.jpg`, {
      credentials: 'include',
    });
    return await res.blob();
  }

  async getEventClip(eventId: string): Promise<Blob> {
    const res = await fetch(`${this.baseUrl}/api/events/${eventId}/clip.mp4`, {
      credentials: 'include',
    });
    return await res.blob();
  }

  async getCameraLatestSnapshot(cameraName: string): Promise<Blob> {
    const res = await fetch(`${this.baseUrl}/api/${cameraName}/latest.jpg`, {
      credentials: 'include',
    });
    return await res.blob();
  }

  async getCameraRecordings(cameraName: string, start: number, end: number): Promise<Blob> {
    const url = new URL(`${this.baseUrl}/api/${cameraName}/recordings`);
    url.searchParams.append('start', String(start));
    url.searchParams.append('end', String(end));
    const res = await fetch(url.toString(), {
      credentials: 'include',
    });
    return await res.blob();
  }

  async createManualEvent(cameraName: string, label: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/api/events/${cameraName}/${label}/create`, {
      method: 'POST',
      credentials: 'include',
    });
    return await res.json();
  }
}

export default FrigateAPI;
