import Consul from 'consul';

export interface ServiceRegistration {
  name: string;
  port: number;
  host?: string;
}

export const registerService = async (
  serviceName: string,
  port: number,
  consulHost: string = 'localhost',
  consulPort: number = 8500
): Promise<void> => {
  try {
    const consul = new Consul({ host: consulHost, port: consulPort });

    const registration = {
      name: serviceName,
      id: `${serviceName}-${port}-${Date.now()}`,
      address: process.env.SERVICE_HOST || 'localhost',
      port,
      check: {
        http: `http://${process.env.SERVICE_HOST || 'localhost'}:${port}/health`,
        interval: '10s',
        timeout: '5s',
        deregistercriticalserviceafter: '1m',
      },
    };

    await consul.agent.service.register(registration);
    console.log(`✅ ${serviceName} registered with Consul`);

    // Deregister on shutdown
    process.on('SIGINT', async () => {
      await consul.agent.service.deregister(registration.id);
      console.log(`✅ ${serviceName} deregistered from Consul`);
      process.exit(0);
    });
  } catch (error) {
    console.error(`❌ Failed to register ${serviceName} with Consul:`, error);
    // Don't throw - allow service to run even if Consul is unavailable
  }
};

export const discoverService = async (
  serviceName: string,
  consulHost: string = 'localhost',
  consulPort: number = 8500
): Promise<{ host: string; port: number } | null> => {
  try {
    const consul = new Consul({ host: consulHost, port: consulPort });
    const services = await consul.health.service({ service: serviceName, passing: true });

    if (services.length === 0) {
      console.warn(`⚠️ No healthy instances of ${serviceName} found`);
      return null;
    }

    // Simple round-robin - get first healthy service
    const service = services[0];
    return {
      host: service.Service.Address,
      port: service.Service.Port,
    };
  } catch (error) {
    console.error(`❌ Failed to discover ${serviceName}:`, error);
    return null;
  }
};
