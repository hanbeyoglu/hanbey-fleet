import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { DriversModule } from './drivers/drivers.module';
import { HgsModule } from './hgs/hgs.module';
import { ExpensesModule } from './expenses/expenses.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { TimelineModule } from './timeline/timeline.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ShiftsModule } from './shifts/shifts.module';
import { DriverReportsModule } from './driver-reports/driver-reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnv,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: () => ({
        throttlers: [{ ttl: 60000, limit: 100 }],
      }),
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    VehiclesModule,
    DriversModule,
    HgsModule,
    ExpensesModule,
    MaintenanceModule,
    TimelineModule,
    ReportsModule,
    NotificationsModule,
    ShiftsModule,
    DriverReportsModule,
  ],
})
export class AppModule {}
