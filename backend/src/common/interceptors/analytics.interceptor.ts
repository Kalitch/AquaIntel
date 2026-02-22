import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Request } from 'express';
import { AnalyticsService } from '../../analytics/analytics.service';

@Injectable()
export class AnalyticsInterceptor implements NestInterceptor {
  constructor(private readonly analyticsService: AnalyticsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const start = Date.now();
    const url = req.url;
    const stationId = req.query['stationId'] as string | undefined;

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - start;
        this.analyticsService.recordRequest(url, ms, stationId);
      }),
      catchError((err) => {
        this.analyticsService.recordError(url);
        return throwError(() => err);
      }),
    );
  }
}
