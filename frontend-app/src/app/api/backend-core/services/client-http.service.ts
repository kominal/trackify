/* tslint:disable */
/* eslint-disable */
/* Code generated by ng-openapi-gen DO NOT EDIT. */

import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';

import { Client } from '../models/client';
import { create } from '../fn/client-http/create';
import { Create$Params } from '../fn/client-http/create';
import { delete$ } from '../fn/client-http/delete';
import { Delete$Params } from '../fn/client-http/delete';
import { list } from '../fn/client-http/list';
import { List$Params } from '../fn/client-http/list';
import { read } from '../fn/client-http/read';
import { Read$Params } from '../fn/client-http/read';
import { update } from '../fn/client-http/update';
import { Update$Params } from '../fn/client-http/update';

@Injectable({ providedIn: 'root' })
export class ClientHttpService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `clientControllerList()` */
  static readonly ClientControllerListPath = '/tenants/{tenantId}/clients';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `list()` instead.
   *
   * This method doesn't expect any request body.
   */
  list$Response(params?: List$Params, context?: HttpContext): Observable<StrictHttpResponse<{
'items': Array<Client>;
'count': number;
}>> {
    return list(this.http, this.rootUrl, params, context);
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `list$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  list(params?: List$Params, context?: HttpContext): Observable<{
'items': Array<Client>;
'count': number;
}> {
    return this.list$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
'items': Array<Client>;
'count': number;
}>): {
'items': Array<Client>;
'count': number;
} => r.body)
    );
  }

  /** Path part for operation `clientControllerCreate()` */
  static readonly ClientControllerCreatePath = '/tenants/{tenantId}/clients';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `create()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  create$Response(params: Create$Params, context?: HttpContext): Observable<StrictHttpResponse<void>> {
    return create(this.http, this.rootUrl, params, context);
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `create$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  create(params: Create$Params, context?: HttpContext): Observable<void> {
    return this.create$Response(params, context).pipe(
      map((r: StrictHttpResponse<void>): void => r.body)
    );
  }

  /** Path part for operation `clientControllerRead()` */
  static readonly ClientControllerReadPath = '/tenants/{tenantId}/clients/{uuid}';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `read()` instead.
   *
   * This method doesn't expect any request body.
   */
  read$Response(params?: Read$Params, context?: HttpContext): Observable<StrictHttpResponse<void>> {
    return read(this.http, this.rootUrl, params, context);
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `read$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  read(params?: Read$Params, context?: HttpContext): Observable<void> {
    return this.read$Response(params, context).pipe(
      map((r: StrictHttpResponse<void>): void => r.body)
    );
  }

  /** Path part for operation `clientControllerUpdate()` */
  static readonly ClientControllerUpdatePath = '/tenants/{tenantId}/clients/{uuid}';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `update()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  update$Response(params: Update$Params, context?: HttpContext): Observable<StrictHttpResponse<void>> {
    return update(this.http, this.rootUrl, params, context);
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `update$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  update(params: Update$Params, context?: HttpContext): Observable<void> {
    return this.update$Response(params, context).pipe(
      map((r: StrictHttpResponse<void>): void => r.body)
    );
  }

  /** Path part for operation `clientControllerDelete()` */
  static readonly ClientControllerDeletePath = '/tenants/{tenantId}/clients/{uuid}';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `delete()` instead.
   *
   * This method doesn't expect any request body.
   */
  delete$Response(params?: Delete$Params, context?: HttpContext): Observable<StrictHttpResponse<void>> {
    return delete$(this.http, this.rootUrl, params, context);
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `delete$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  delete(params?: Delete$Params, context?: HttpContext): Observable<void> {
    return this.delete$Response(params, context).pipe(
      map((r: StrictHttpResponse<void>): void => r.body)
    );
  }

}
