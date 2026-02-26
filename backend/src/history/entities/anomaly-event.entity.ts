import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index,
} from 'typeorm';

@Entity('anomaly_events')
export class AnomalyEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'station_id', length: 30 })
  @Index()
  stationId: string;

  @CreateDateColumn({ name: 'detected_at', type: 'timestamptz' })
  detectedAt: Date;

  @Column({ length: 10 })
  severity: string;

  @Column({ name: 'flow_value', type: 'decimal', precision: 12, scale: 4, nullable: true })
  flowValue: number | null;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  @Column({ name: 'drought_severity', type: 'varchar', length: 50, nullable: true })
  droughtSeverity: string | null;

  @Column({ name: 'sustainability_score', type: 'integer', nullable: true })
  sustainabilityScore: number | null;
}
