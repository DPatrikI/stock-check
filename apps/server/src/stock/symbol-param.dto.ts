import { IsAlphanumeric, IsUppercase, Length } from 'class-validator';

export class SymbolParam {
  @IsAlphanumeric()
  @IsUppercase()
  @Length(1, 5)
  symbol: string;
}