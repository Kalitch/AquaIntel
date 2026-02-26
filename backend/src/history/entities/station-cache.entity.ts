import {
  Entity, PrimaryColumn, Column, UpdateDateColumn,
} from 'typeorm';

@Entity('station_cache')
export class StationCache {
  @PrimaryColumn({ name: 'station_id', length: 30 })
  stationId: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  name: string | null;

  @Column({ type: 'varchar', length: 2, nullable: true })
  state: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number | null;

  @Column({ name: 'total_queries', type: 'integer', default: 0 })
  totalQueries: number;

  @UpdateDateColumn({ name: 'last_seen', type: 'timestamptz' })
  lastSeen: Date;
}
