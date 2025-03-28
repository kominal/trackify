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

import { readActive } from '../fn/tracking-session-http/read-active';
import { ReadActive$Params } from '../fn/tracking-session-http/read-active';
import { stopActive } from '../fn/tracking-session-http/stop-active';
import { StopActive$Params } from '../fn/tracking-session-http/stop-active';
import { TrackingSession } from '../models/tracking-session';
import { updateActive } from '../fn/tracking-session-http/update-active';
import { UpdateActive$Params } from '../fn/tracking-session-http/update-active';

@Injectable({ providedIn: 'root' })
export class TrackingSessionHttpService extends BaseService {
  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  /** Path part for operation `trackingSessionControllerReadActive()` */
  static readonly TrackingSessionControllerReadActivePath = '/tenants/{tenantId}/tracking-sessions/active';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `readActive()` instead.
   *
   * This method doesn't expect any request body.
   */
  readActive$Response(params: ReadActive$Params, context?: HttpContext): Observable<StrictHttpResponse<(TrackingSession | null)>> {
    return readActive(this.http, this.rootUrl, params, context);
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `readActive$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  readActive(params: ReadActive$Params, context?: HttpContext): Observable<(TrackingSession | null)> {
    return this.readActive$Response(params, context).pipe(
      map((r: StrictHttpResponse<(TrackingSession | null)>): (TrackingSession | null) => r.body)
    );
  }

  /** Path part for operation `trackingSessionControllerUpdateActive()` */
  static readonly TrackingSessionControllerUpdateActivePath = '/tenants/{tenantId}/tracking-sessions/active';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `updateActive()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  updateActive$Response(params: UpdateActive$Params, context?: HttpContext): Observable<StrictHttpResponse<void>> {
    return updateActive(this.http, this.rootUrl, params, context);
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `updateActive$Response()` instead.
   *
   * This method sends `application/json` and handles request body of type `application/json`.
   */
  updateActive(params: UpdateActive$Params, context?: HttpContext): Observable<void> {
    return this.updateActive$Response(params, context).pipe(
      map((r: StrictHttpResponse<void>): void => r.body)
    );
  }

  /** Path part for operation `trackingSessionControllerStopActive()` */
  static readonly TrackingSessionControllerStopActivePath = '/tenants/{tenantId}/tracking-sessions/active';

  /**
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `stopActive()` instead.
   *
   * This method doesn't expect any request body.
   */
  stopActive$Response(params: StopActive$Params, context?: HttpContext): Observable<StrictHttpResponse<void>> {
    return stopActive(this.http, this.rootUrl, params, context);
  }

  /**
   * This method provides access only to the response body.
   * To access the full response (for headers, for example), `stopActive$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  stopActive(params: StopActive$Params, context?: HttpContext): Observable<void> {
    return this.stopActive$Response(params, context).pipe(
      map((r: StrictHttpResponse<void>): void => r.body)
    );
  }

}
