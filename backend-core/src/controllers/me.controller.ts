import { ActivityEntity, ActivityUploadRequest } from '@entities/activity.entity';
import { UserSettings } from '@entities/user.entity';
import { UserGuard } from '@guards/user.guard';
import { UserContext, UserCtx } from '@helpers/context.decorator';
import { CustomOperationName } from '@helpers/custom-operation-name.decorator';
import { RangeParams } from '@models/range.model';
import { Body, Controller, Delete, Get, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ActivityService } from '@services/activity.service';
import { UserSettingsService } from '@services/user-settings.service';

// Data of the signed-in user that belongs to no organisation: settings and the window activity of their PC.
@UseGuards(UserGuard)
@ApiTags('me-http')
@Controller('me')
export class MeController {
  public constructor(
    private readonly activityService: ActivityService,
    private readonly userSettingsService: UserSettingsService,
  ) {}

  @Get('settings')
  @CustomOperationName()
  public readSettings(@UserCtx() userContext: UserContext): Promise<UserSettings> {
    return this.userSettingsService.read(userContext);
  }

  @Put('settings')
  @CustomOperationName()
  public updateSettings(@UserCtx() userContext: UserContext, @Body() settings: UserSettings): Promise<void> {
    return this.userSettingsService.update(userContext, settings);
  }

  @Post('activities')
  @CustomOperationName()
  public uploadActivities(@UserCtx() userContext: UserContext, @Body() { segments }: ActivityUploadRequest): Promise<void> {
    return this.activityService.upload(userContext, segments);
  }

  @Get('activities')
  @CustomOperationName()
  @ApiOkResponse({ type: [ActivityEntity] })
  public listActivities(@UserCtx() userContext: UserContext, @Query() range: RangeParams): Promise<ActivityEntity[]> {
    return this.activityService.list(userContext, range);
  }

  @Delete('activities')
  @CustomOperationName()
  public deleteActivities(@UserCtx() userContext: UserContext, @Query() range: RangeParams): Promise<void> {
    return this.activityService.delete(userContext, range);
  }
}
