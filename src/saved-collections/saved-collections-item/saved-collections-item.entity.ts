import {BaseEntity, Entity, PrimaryGeneratedColumn, Column, Unique} from 'typeorm';

@Unique(['id'])
@Unique(['collectionId', 'poiId'])
@Entity()
export class SavedCollectionsItem extends BaseEntity{
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  collectionId: number;

  @Column()
  poiId: number;
}