/* tslint:disable */
/* eslint-disable */
/* Code generated by ng-openapi-gen DO NOT EDIT. */

import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { Client } from '../../models/client';

export interface List$Params {
  tenantId: string;
  active?: string;
  direction?: string;
  pageIndex?: number;
  pageSize?: number;
  filter?: string;
  select?: string;
}

export function list(http: HttpClient, rootUrl: string, params: List$Params, context?: HttpContext): Observable<StrictHttpResponse<{
'items': Array<Client>;
'count': number;
}>> {
  const rb = new RequestBuilder(rootUrl, list.PATH, 'get');
  if (params) {
    rb.path('tenantId', params.tenantId, {});
    rb.query('active', params.active, {});
    rb.query('direction', params.direction, {});
    rb.query('pageIndex', params.pageIndex, {});
    rb.query('pageSize', params.pageSize, {});
    rb.query('filter', params.filter, {});
    rb.query('select', params.select, {});
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<{
      'items': Array<Client>;
      'count': number;
      }>;
    })
  );
}

list.PATH = '/tenants/{tenantId}/clients';
