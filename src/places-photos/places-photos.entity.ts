import {BaseEntity, Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique} from 'typeorm';

@Unique(['place'])
@Entity()
export class PlacesPhotos extends BaseEntity{
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  place: string;

  @Column()
  photo: string;

  @Column()
  other_photos: string;

  @Column({ default: false, nullable: true })
  is_poi?: boolean
}