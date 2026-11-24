import { bootstrap } from '@kominal/common-nestjs';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { TrackifyModule } from './trackify.module';

void bootstrap(AppModule, [TrackifyModule], true, true).catch((error: unknown) => {
  new Logger('Bootstrap').error(error instanceof Error ? (error.stack ?? error.message) : String(error));
  process.exit(1);
});
