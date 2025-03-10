import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Record, RecordModel } from '../entities/record.entity';
import { EntityService } from '../helpers/entity-service.helper';

@Injectable()
export class RecordService extends EntityService<Record> {
  public constructor(@InjectModel(Record.name) private recordModel: RecordModel) {
    super(recordModel);
  }
}
