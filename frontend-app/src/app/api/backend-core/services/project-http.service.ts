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

import { create } from '../fn/project-http/create';
import { Create$Params } from '../fn/project-http/create';
import { delete$ } from '../fn/project-http/delete';
import { Delete$Params } from '../fn/project-http/delete';
import { list } from '../fn/project-http/list';
import { List$Params } from '../fn/project-http/list';
import { Project } from '../models/project';
import { read } from '../fn/project-http/read';
import { Read$Params } from '../fn/project-http/read';
import { update } from '../fn/project-http/update';
import { Update$Params } from '../fn/project-http/update';
import { upsert } from '../fn/project-http/upsert';
import { Upsert$Params } from '../fn/project-http/upsert';

@Injectable({ providedIn: 'root' })
export class ProjectHttpService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `projectControllerList()` */
  static readonly ProjectControllerListPath = '/tenants/{tenantId}/projects';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `list()` instead.
   *
   * This method doesn't expect any request body.
   */
  list$Response(params: List$Params, context?: HttpContext): Observable<StrictHttpResponse<{
'items': Array<Project>;
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
  list(params: List$Params, context?: HttpContext): Observable<{
'items': Array<Project>;
'count': number;
}> {
    return this.list$Response(params, context).pipe(
      map((r: StrictHttpResponse<{
'items': Array<Project>;
'count': number;
}>): {
'items': Array<Project>;
'count': number;
} => r.body)
    );
  }

  /** Path part for operation `projectControllerCreate()` */
  static readonly ProjectControllerCreatePath = '/tenants/{tenantId}/projects';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `create()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  create$Response(params: Create$Params, context?: HttpContext): Observable<StrictHttpResponse<Project>> {
    return create(this.http, this.rootUrl, params, context);
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `create$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  create(params: Create$Params, context?: HttpContext): Observable<Project> {
    return this.create$Response(params, context).pipe(
      map((r: StrictHttpResponse<Project>): Project => r.body)
    );
  }

  /** Path part for operation `projectControllerRead()` */
  static readonly ProjectControllerReadPath = '/tenants/{tenantId}/projects/{uuid}';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `read()` instead.
   *
   * This method doesn't expect any request body.
   */
  read$Response(params: Read$Params, context?: HttpContext): Observable<StrictHttpResponse<Project>> {
    return read(this.http, this.rootUrl, params, context);
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `read$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  read(params: Read$Params, context?: HttpContext): Observable<Project> {
    return this.read$Response(params, context).pipe(
      map((r: StrictHttpResponse<Project>): Project => r.body)
    );
  }

  /** Path part for operation `projectControllerUpsert()` */
  static readonly ProjectControllerUpsertPath = '/tenants/{tenantId}/projects/{uuid}';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `upsert()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  upsert$Response(params: Upsert$Params, context?: HttpContext): Observable<StrictHttpResponse<(Project | void)>> {
    return upsert(this.http, this.rootUrl, params, context);
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `upsert$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  upsert(params: Upsert$Params, context?: HttpContext): Observable<(Project | void)> {
    return this.upsert$Response(params, context).pipe(
      map((r: StrictHttpResponse<(Project | void)>): (Project | void) => r.body)
    );
  }

  /** Path part for operation `projectControllerDelete()` */
  static readonly ProjectControllerDeletePath = '/tenants/{tenantId}/projects/{uuid}';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `delete()` instead.
   *
   * This method doesn't expect any request body.
   */
  delete$Response(params: Delete$Params, context?: HttpContext): Observable<StrictHttpResponse<void>> {
    return delete$(this.http, this.rootUrl, params, context);
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `delete$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  delete(params: Delete$Params, context?: HttpContext): Observable<void> {
    return this.delete$Response(params, context).pipe(
      map((r: StrictHttpResponse<void>): void => r.body)
    );
  }

  /** Path part for operation `projectControllerUpdate()` */
  static readonly ProjectControllerUpdatePath = '/tenants/{tenantId}/projects/{uuid}';

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

}
