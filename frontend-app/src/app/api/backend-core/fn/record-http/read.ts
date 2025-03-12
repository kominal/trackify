/* tslint:disable */
/* eslint-disable */
/* Code generated by ng-openapi-gen DO NOT EDIT. */

import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { Record } from '../../models/record';

export interface Read$Params {
  tenantId: string;
  uuid: string;
}

export function read(http: HttpClient, rootUrl: string, params: Read$Params, context?: HttpContext): Observable<StrictHttpResponse<Record>> {
  const rb = new RequestBuilder(rootUrl, read.PATH, 'get');
  if (params) {
    rb.path('tenantId', params.tenantId, {});
    rb.path('uuid', params.uuid, {});
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<Record>;
    })
  );
}

read.PATH = '/tenants/{tenantId}/records/{uuid}';
