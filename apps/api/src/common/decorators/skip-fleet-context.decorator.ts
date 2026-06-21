import { SetMetadata } from '@nestjs/common';

export const SKIP_FLEET_CONTEXT_KEY = 'skipFleetContext';
export const SkipFleetContext = () => SetMetadata(SKIP_FLEET_CONTEXT_KEY, true);
