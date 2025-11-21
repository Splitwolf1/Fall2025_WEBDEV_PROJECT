declare module 'consul' {
  interface ConsulOptions {
    host?: string;
    port?: number;
  }

  interface ServiceRegistration {
    name: string;
    id: string;
    address: string;
    port: number;
    check?: {
      http?: string;
      interval?: string;
      timeout?: string;
      deregistercriticalserviceafter?: string;
    };
  }

  interface Service {
    Address: string;
    Port: number;
  }

  interface HealthService {
    Service: Service;
  }

  class Consul {
    constructor(options?: ConsulOptions);
    agent: {
      service: {
        register(registration: ServiceRegistration): Promise<void>;
        deregister(id: string): Promise<void>;
      };
    };
    health: {
      service(options: { service: string; passing: boolean }): Promise<HealthService[]>;
    };
  }

  export = Consul;
}

