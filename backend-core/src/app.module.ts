import { MailerModule } from '@nestjs-modules/mailer';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ModelDefinition, MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ClientController } from './controllers/client.controller';
import { DashboardController } from './controllers/dashboard.controller';
import { TenantController } from './controllers/tenant.controller';
import { Client, ClientSchema } from './entities/client.entity';
import { Membership, MembershipSchema } from './entities/membership.entity';
import { Project, ProjectSchema } from './entities/project.entity';
import { Record, RecordSchema } from './entities/record.entity';
import { Task, TaskSchema } from './entities/task.entity';
import { Tenant, TenantSchema } from './entities/tenant.entity';
import { TenantGuard } from './guards/tenant.guard';
import { UserGuard } from './guards/user.guard';
import { RequestLoggingMiddleware } from './middlewares/request-logging.middleware';
import { AuthService } from './services/auth.service';
import { ClientService } from './services/client.service';
import { DashboardService } from './services/dashboard.service';
import { MailService } from './services/mail.service';
import { TenantService } from './services/tenant.service';

export const modelDefinitions: ModelDefinition[] = [
  { name: Client.name, schema: ClientSchema },
  { name: Membership.name, schema: MembershipSchema },
  { name: Project.name, schema: ProjectSchema },
  { name: Record.name, schema: RecordSchema },
  { name: Task.name, schema: TaskSchema },
  { name: Tenant.name, schema: TenantSchema },
];

export const moduleDefinition = {
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGODB_CONNECTION_STRING || 'mongodb://127.0.0.1/local'),
    MongooseModule.forFeature(modelDefinitions),
    MailerModule.forRoot({
      transport: process.env.MAIL_CONNECTION_STRING || 'smtps://user@example.com:topsecret@smtp.example.com',
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [TenantController, ClientController, DashboardController],
  providers: [TenantService, AuthService, MailService, ClientService, TenantGuard, UserGuard, DashboardService],
};

@Module(moduleDefinition)
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');
  }
}
