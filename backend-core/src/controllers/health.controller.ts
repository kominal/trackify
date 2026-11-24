import { CustomOperationName } from '@helpers/custom-operation-name.decorator';
import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthReport, HealthService } from '@services/health.service';
import { Response } from 'express';

export function isHealthy(report: HealthReport): boolean {
  return report.services.every(({ status }) => status === 'ONLINE');
}

@ApiTags('health-http')
@Controller('health')
export class HealthController {
  public constructor(private healthService: HealthService) {}

  // 503 while the database is unreachable, so the container health check and the status page
  // notice (same behaviour as flow).
  @Get()
  @CustomOperationName()
  public readHealth(@Res({ passthrough: true }) response: Response): HealthReport {
    const report = this.healthService.readHealth();
    if (!isHealthy(report)) {
      response.status(HttpStatus.SERVICE_UNAVAILABLE);
    }
    return report;
  }
}
