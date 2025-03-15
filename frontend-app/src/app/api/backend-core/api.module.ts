/* tslint:disable */
/* eslint-disable */
/* Code generated by ng-openapi-gen DO NOT EDIT. */

import { NgModule, ModuleWithProviders, SkipSelf, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiConfiguration, ApiConfigurationParams } from './api-configuration';

import { TenantHttpService } from './services/tenant-http.service';
import { ClientHttpService } from './services/client-http.service';
import { DashboardHttpService } from './services/dashboard-http.service';
import { ProjectHttpService } from './services/project-http.service';
import { RecordHttpService } from './services/record-http.service';
import { TaskHttpService } from './services/task-http.service';
import { TrackingSessionHttpService } from './services/tracking-session-http.service';

/**
 * Module that provides all services and configuration.
 */
@NgModule({
  imports: [],
  exports: [],
  declarations: [],
  providers: [
    TenantHttpService,
    ClientHttpService,
    DashboardHttpService,
    ProjectHttpService,
    RecordHttpService,
    TaskHttpService,
    TrackingSessionHttpService,
    ApiConfiguration
  ],
})
export class ApiModule {
  static forRoot(params: ApiConfigurationParams): ModuleWithProviders<ApiModule> {
    return {
      ngModule: ApiModule,
      providers: [
        {
          provide: ApiConfiguration,
          useValue: params
        }
      ]
    }
  }

  constructor( 
    @Optional() @SkipSelf() parentModule: ApiModule,
    @Optional() http: HttpClient
  ) {
    if (parentModule) {
      throw new Error('ApiModule is already loaded. Import in your base AppModule only.');
    }
    if (!http) {
      throw new Error('You need to import the HttpClientModule in your AppModule! \n' +
      'See also https://github.com/angular/angular/issues/20575');
    }
  }
}
