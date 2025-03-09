import { ApiProperty } from '@nestjs/swagger';

export enum PhysicalRiskScenario {
  DUMMY = 'DUMMY',
}
export const PhysicalRiskScenarioDecorator = ApiProperty({ enum: PhysicalRiskScenario, enumName: 'PhysicalRiskScenario' });

export enum TransitionRiskScenario {
  DUMMY = 'DUMMY',
}
export const TransitionRiskScenarioDecorator = ApiProperty({ enum: TransitionRiskScenario, enumName: 'TransitionRiskScenario' });

export class DashboardRequest {
  public assetId: string;
  public period: Date[];
  @PhysicalRiskScenarioDecorator public physicalRiskScenario: PhysicalRiskScenario;
  @TransitionRiskScenarioDecorator public transitionRiskScenario: TransitionRiskScenario;
}
