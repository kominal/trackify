import { ClientController } from '@controllers/client.controller';
import { DashboardController } from '@controllers/dashboard.controller';
import { FrontendController } from '@controllers/frontend.controller';
import { HealthController } from '@controllers/health.controller';
import { MeController } from '@controllers/me.controller';
import { MembershipController } from '@controllers/membership.controller';
import { ProjectController } from '@controllers/project.controller';
import { TaskController } from '@controllers/task.controller';
import { TenantController } from '@controllers/tenant.controller';
import { TimeEntryController } from '@controllers/time-entry.controller';
import { TrackingController } from '@controllers/tracking.controller';
import { ActivityEntity, ActivitySchema } from '@entities/activity.entity';
import { ClientEntity, ClientSchema } from '@entities/client.entity';
import { MembershipEntity, MembershipSchema } from '@entities/membership.entity';
import { ProjectEntity, ProjectSchema } from '@entities/project.entity';
import { TaskEntity, TaskSchema } from '@entities/task.entity';
import { TenantEntity, TenantSchema } from '@entities/tenant.entity';
import { TimeEntryEntity, TimeEntrySchema } from '@entities/time-entry.entity';
import { TrackingSessionEntity, TrackingSessionSchema } from '@entities/tracking-session.entity';
import { UserEntity, UserSchema } from '@entities/user.entity';
import { ClientService } from '@entity-services/client.service';
import { MembershipService } from '@entity-services/membership.service';
import { ProjectService } from '@entity-services/project.service';
import { TaskService } from '@entity-services/task.service';
import { TenantService } from '@entity-services/tenant.service';
import { TimeEntryService } from '@entity-services/time-entry.service';
import { TenantGuard } from '@guards/tenant.guard';
import { UserGuard } from '@guards/user.guard';
import { Module, ModuleMetadata } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivityService } from '@services/activity.service';
import { AuthService } from '@services/auth.service';
import { DashboardService } from '@services/dashboard.service';
import { HealthService } from '@services/health.service';
import { MailService } from '@services/mail.service';
import { TrackingService } from '@services/tracking.service';
import { UserSettingsService } from '@services/user-settings.service';

// Exported as a named const so the swagger generator (bootstrap with GENERATE_SWAGGER) can reflect over it.
export const moduleMetadata: ModuleMetadata = {
  imports: [
    MongooseModule.forFeature([
      { name: TenantEntity.name, schema: TenantSchema },
      { name: MembershipEntity.name, schema: MembershipSchema },
      { name: UserEntity.name, schema: UserSchema },
      { name: ClientEntity.name, schema: ClientSchema },
      { name: ProjectEntity.name, schema: ProjectSchema },
      { name: TaskEntity.name, schema: TaskSchema },
      { name: TimeEntryEntity.name, schema: TimeEntrySchema },
      { name: TrackingSessionEntity.name, schema: TrackingSessionSchema },
      { name: ActivityEntity.name, schema: ActivitySchema },
    ]),
  ],
  controllers: [TenantController, MembershipController, ClientController, ProjectController, TaskController, TimeEntryController, TrackingController, DashboardController, MeController, FrontendController, HealthController],
  providers: [AuthService, UserGuard, TenantGuard, TenantService, MembershipService, ClientService, ProjectService, TaskService, TimeEntryService, TrackingService, ActivityService, DashboardService, UserSettingsService, MailService, HealthService],
};

@Module(moduleMetadata)
export class TrackifyModule {}
