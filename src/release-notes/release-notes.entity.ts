import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'release_notes' })
export class ReleaseNote extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'english_title', length: 255 })
  englishTitle: string;

  @Column({ name: 'hebrew_title', length: 255 })
  hebrewTitle: string;

  @Column({ name: 'english_description', type: 'text', nullable: true })
  englishDescription: string;

  @Column({ name: 'hebrew_description', type: 'text', nullable: true })
  hebrewDescription: string;

  @Column({ name: 'english_how_to_use', type: 'text', nullable: true })
  englishHowToUse: string

  @Column({ name: 'hebrew_how_to_use', type: 'text', nullable: true })
  hebrewHowToUse: string

  @Column({ name: 'image_urls', type: 'simple-json', nullable: true })
  imageUrls: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

