import { ApiProperty } from '@nestjs/swagger';

export class SyncResultDto {
  @ApiProperty({ description: 'Number of transits successfully imported' })
  imported: number;

  @ApiProperty({ description: 'Number of records skipped due to validation errors' })
  skipped: number;

  @ApiProperty({ description: 'Number of duplicate reference numbers ignored' })
  duplicates: number;

  @ApiProperty({ description: 'Number of records where vehicle plate was not found' })
  vehicleNotFound: number;

  @ApiProperty({ description: 'Number of transits matched to a shift' })
  matchedShift: number;

  @ApiProperty({ description: 'Number of transits with no matching shift' })
  unmatchedShift: number;
}
