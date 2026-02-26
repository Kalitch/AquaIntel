import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThan } from "typeorm";
import { StationSnapshot } from "./entities/station-snapshot.entity";
import { AnomalyEvent } from "./entities/anomaly-event.entity";
import { StationCache } from "./entities/station-cache.entity";
import {
  SnapshotDto,
  StationHistoryResponse,
  PlatformSummary,
  ScoreTrendPoint,
} from "./history.types";

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);

  constructor(
    @InjectRepository(StationSnapshot)
    private readonly snapshotRepo: Repository<StationSnapshot>,
    @InjectRepository(AnomalyEvent)
    private readonly anomalyRepo: Repository<AnomalyEvent>,
    @InjectRepository(StationCache)
    private readonly stationCacheRepo: Repository<StationCache>,
  ) {}

  // ── Called after every /intelligence response ─────────────────────────────
  // Fire-and-forget — never awaited by the controller
  async writeSnapshot(dto: SnapshotDto): Promise<void> {
    try {
      // Write snapshot row
      await this.snapshotRepo.save(
        this.snapshotRepo.create({
          stationId: dto.stationId,
          flowValue: dto.flowValue,
          flowUnit: dto.flowUnit,
          sustainabilityScore: dto.sustainabilityScore,
          anomalySeverity: dto.anomalySeverity,
          droughtSeverity: dto.droughtSeverity,
          currentPercentile: dto.currentPercentile,
          movingAvg7: dto.movingAvg7,
          movingAvg30: dto.movingAvg30,
          volatilityIndex: dto.volatilityIndex,
        }),
      );

      // If anomaly detected, also write anomaly event
      if (dto.anomalySeverity && dto.anomalySeverity !== "none") {
        await this.anomalyRepo.save(
          this.anomalyRepo.create({
            stationId: dto.stationId,
            severity: dto.anomalySeverity,
            flowValue: dto.flowValue,
            droughtSeverity: dto.droughtSeverity,
            sustainabilityScore: dto.sustainabilityScore,
          }),
        );
      }

      // Upsert station cache using raw SQL —
      // TypeORM orUpdate with function parameters is not supported
      await this.stationCacheRepo.query(
        `INSERT INTO station_cache (station_id, total_queries, last_seen)
         VALUES ($1, 1, NOW())
         ON CONFLICT (station_id)
         DO UPDATE SET
           total_queries = station_cache.total_queries + 1,
           last_seen = NOW()`,
        [dto.stationId],
      );
    } catch (err) {
      // Never throw — history writes must not affect the main request
      this.logger.warn(
        `Failed to write snapshot for ${dto.stationId}: ${String(err)}`,
      );
    }
  }

  // ── Station history ───────────────────────────────────────────────────────
  async getStationHistory(
    stationId: string,
    days = 90,
  ): Promise<StationHistoryResponse> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [snapshots, anomalyEvents] = await Promise.all([
      this.snapshotRepo.find({
        where: { stationId, observedAt: MoreThan(since) },
        order: { observedAt: "ASC" },
        take: 2000,
      }),
      this.anomalyRepo.find({
        where: { stationId, detectedAt: MoreThan(since) },
        order: { detectedAt: "DESC" },
        take: 100,
      }),
    ]);

    // Build daily score trend (aggregate snapshots by calendar date)
    const byDate = new Map<string, number[]>();
    for (const s of snapshots) {
      if (s.sustainabilityScore === null) continue;
      const date = s.observedAt.toISOString().split("T")[0];
      const arr = byDate.get(date) ?? [];
      arr.push(s.sustainabilityScore);
      byDate.set(date, arr);
    }

    const scoreTrend: ScoreTrendPoint[] = Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, scores]) => ({
        date,
        avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        minScore: Math.min(...scores),
        maxScore: Math.max(...scores),
        sampleCount: scores.length,
      }));

    return {
      stationId,
      totalSnapshots: snapshots.length,
      snapshots: snapshots.map((s) => ({
        observedAt: s.observedAt.toISOString(),
        flowValue: s.flowValue !== null ? Number(s.flowValue) : null,
        sustainabilityScore: s.sustainabilityScore,
        anomalySeverity: s.anomalySeverity,
        droughtSeverity: s.droughtSeverity,
        currentPercentile: s.currentPercentile,
        movingAvg7: s.movingAvg7 !== null ? Number(s.movingAvg7) : null,
        movingAvg30: s.movingAvg30 !== null ? Number(s.movingAvg30) : null,
        volatilityIndex:
          s.volatilityIndex !== null ? Number(s.volatilityIndex) : null,
      })),
      anomalyEvents: anomalyEvents.map((e) => ({
        detectedAt: e.detectedAt.toISOString(),
        severity: e.severity,
        flowValue: e.flowValue !== null ? Number(e.flowValue) : null,
        message: e.message,
        droughtSeverity: e.droughtSeverity,
        sustainabilityScore: e.sustainabilityScore,
      })),
      scoreTrend,
    };
  }

  // ── Platform summary ──────────────────────────────────────────────────────
  async getPlatformSummary(): Promise<PlatformSummary> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalSnapshots,
      totalAnomalyEvents,
      totalStationsTracked,
      snapshotsLast24h,
      snapshotsLast7d,
      mostQueriedStations,
      recentAnomalies,
    ] = await Promise.all([
      this.snapshotRepo.count(),
      this.anomalyRepo.count(),
      this.stationCacheRepo.count(),
      this.snapshotRepo.count({ where: { observedAt: MoreThan(yesterday) } }),
      this.snapshotRepo.count({ where: { observedAt: MoreThan(lastWeek) } }),
      this.stationCacheRepo.find({
        order: { totalQueries: "DESC" },
        take: 10,
      }),
      this.anomalyRepo.find({
        order: { detectedAt: "DESC" },
        take: 10,
      }),
    ]);

    return {
      totalSnapshots,
      totalAnomalyEvents,
      totalStationsTracked,
      snapshotsLast24h,
      snapshotsLast7d,
      mostQueriedStations: mostQueriedStations.map((s) => ({
        stationId: s.stationId,
        totalQueries: s.totalQueries,
        lastSeen: s.lastSeen.toISOString(),
      })),
      recentAnomalies: recentAnomalies.map((e) => ({
        stationId: e.stationId,
        detectedAt: e.detectedAt.toISOString(),
        severity: e.severity,
        flowValue: e.flowValue !== null ? Number(e.flowValue) : null,
        message: e.message,
        droughtSeverity: e.droughtSeverity,
        sustainabilityScore: e.sustainabilityScore,
      })),
    };
  }
}
