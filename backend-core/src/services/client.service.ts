import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Client, ClientModel } from '../entities/client.entity';
import { EntityService } from '../helpers/entity-service.helper';

@Injectable()
export class ClientService extends EntityService<Client> {
  public constructor(@InjectModel(Client.name) private clientModel: ClientModel) {
    super(clientModel);
  }
}
