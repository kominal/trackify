import { CommonLogger } from '@helpers/logger';
import { RequestLoggingMiddleware } from '@middlewares/request-logging.middleware';
import { MailerModule } from '@nestjs-modules/mailer';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TrackifyModule } from './trackify.module';

export const moduleDefinition = {
  imports: [
    TrackifyModule,
    ConfigModule.forRoot(),
    // Baseline per-IP rate limit.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 1_000 }]),
    MongooseModule.forRoot(process.env.MONGODB_CONNECTION_STRING ?? 'mongodb://localhost/trackify'),
    MailerModule.forRoot({
      transport: process.env.MAIL_CONNECTION_STRING ?? 'smtps://user@example.com:topsecret@smtp.example.com',
    }),
  ],
  providers: [CommonLogger, { provide: APP_GUARD, useClass: ThrottlerGuard }],
};

@Module(moduleDefinition)
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    // Health and the activity upload (one request per minute and desktop app) would drown everything else.
    consumer.apply(RequestLoggingMiddleware).exclude('health', 'me/activities').forRoutes('{*splat}');
  }
}
