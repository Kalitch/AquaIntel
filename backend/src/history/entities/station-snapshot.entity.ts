import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index,
} from 'typeorm';

@Entity('station_snapshots')
@Index(['stationId', 'observedAt'])
export class StationSnapshot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'station_id', length: 30 })
  @Index()
  stationId: string;

  @CreateDateColumn({ name: 'observed_at', type: 'timestamptz' })
  observedAt: Date;

  @Column({ name: 'flow_value', type: 'decimal', precision: 12, scale: 4, nullable: true })
  flowValue: number | null;

  @Column({ name: 'flow_unit', type: 'varchar', length: 20, nullable: true })
  flowUnit: string | null;

  @Column({ name: 'sustainability_score', type: 'integer', nullable: true })
  sustainabilityScore: number | null;

  @Column({ name: 'anomaly_severity', type: 'varchar', length: 10, nullable: true })
  anomalySeverity: string | null;

  @Column({ name: 'drought_severity', type: 'varchar', length: 50, nullable: true })
  droughtSeverity: string | null;

  @Column({ name: 'current_percentile', type: 'integer', nullable: true })
  currentPercentile: number | null;

  @Column({ name: 'moving_avg_7', type: 'decimal', precision: 12, scale: 4, nullable: true })
  movingAvg7: number | null;

  @Column({ name: 'moving_avg_30', type: 'decimal', precision: 12, scale: 4, nullable: true })
  movingAvg30: number | null;

  @Column({ name: 'volatility_index', type: 'decimal', precision: 8, scale: 4, nullable: true })
  volatilityIndex: number | null;
}
