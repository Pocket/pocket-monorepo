/* eslint-disable @typescript-eslint/no-unused-vars */
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Represents the shared_urls table in readitla_shares database
 */
@Entity({ name: 'share_urls', schema: 'readitla_shares' })
export class ShareUrls {
  @PrimaryGeneratedColumn({ name: 'share_url_id' })
  shareUrlId: number; // eslint-disable-line

  @Column({ name: 'user_id' })
  userId: number; // eslint-disable-line

  @Column({ name: 'item_id' })
  itemId: number; // eslint-disable-line

  @Column({ name: 'resolved_id' })
  resolvedId: number; // eslint-disable-line

  @Column({ name: 'given_url' })
  givenUrl: string; // eslint-disable-line

  @Column({ name: 'api_id' })
  apiId: number; // eslint-disable-line

  @Column({ name: 'service_id' })
  serviceId: number; // eslint-disable-line

  @Column({ name: 'time_generated' })
  timeGenerated: number; // eslint-disable-line

  @Column({ name: 'time_shared' })
  timeShared: number; // eslint-disable-line
}
