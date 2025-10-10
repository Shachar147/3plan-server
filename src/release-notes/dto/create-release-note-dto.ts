import { IsArray, IsNotEmpty, IsOptional, IsString, MaxLength, ArrayNotEmpty } from 'class-validator';

export class CreateReleaseNoteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  englishTitle: string;

  @IsString()
  @IsOptional()
  hebrewTitle?: string;

  @IsString()
  @IsOptional()
  englishDescription?: string;

  @IsString()
  @IsOptional()
  hebrewHowToUse?: string;

  @IsString()
  @IsOptional()
  englishHowToUse?: string;

  @IsString()
  @IsOptional()
  hebrewDescription?: string;

  @IsArray()
  @ArrayNotEmpty()
  imageUrls: string[];
}

