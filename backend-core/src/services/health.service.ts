import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ConnectionStates } from 'mongoose';

export interface HealthReport {
  services: { name: string; status: 'ONLINE' | 'OFFLINE' }[];
}

@Injectable()
export class HealthService {
  // The Nest-managed connection must be injected — the global `mongoose.connection` is never
  // opened by @nestjs/mongoose and always reads as disconnected.
  public constructor(@InjectConnection() private readonly connection: Connection) {}

  public readHealth(): HealthReport {
    return { services: [{ name: 'Database', status: this.connection.readyState === ConnectionStates.connected ? 'ONLINE' : 'OFFLINE' }] };
  }
}
