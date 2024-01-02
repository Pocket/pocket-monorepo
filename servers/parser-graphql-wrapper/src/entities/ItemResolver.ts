/* eslint-disable @typescript-eslint/no-unused-vars */
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * Represents the items_resolver database
 */
@Entity({ name: 'items_resolver', schema: 'readitla_b' })
export class ItemResolver {
  //prettier & eslint are conflicting on this file for indents, hence the eslint-disables

  @PrimaryGeneratedColumn({ name: 'item_id' })
  itemId: number; // eslint-disable-line

  @Column({ name: 'normal_url' })
  normalUrl: string; // eslint-disable-line

  @Column({ name: 'search_hash' })
  searchHash: string; // eslint-disable-line

  @Column({ name: 'resolved_id' })
  resolvedId: number; // eslint-disable-line

  @Column({ name: 'has_old_dupes' })
  hasOldDupes: boolean; // eslint-disable-line
}
