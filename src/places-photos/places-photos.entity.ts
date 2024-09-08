import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

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
}