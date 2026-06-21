import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtPayload } from '@hanbey-fleet/shared';
import { VehiclesRepository } from '../vehicles/vehicles.repository';
import { ExpensesRepository } from '../expenses/expenses.repository';
import { HgsRepository } from '../hgs/hgs.repository';
import { MaintenanceRepository } from '../maintenance/maintenance.repository';
import { FleetScopeService } from '../common/fleet/fleet-scope.service';

@Injectable()
export class ReportsService {
  constructor(
    private vehiclesRepository: VehiclesRepository,
    private expensesRepository: ExpensesRepository,
    private hgsRepository: HgsRepository,
    private maintenanceRepository: MaintenanceRepository,
    private fleetScope: FleetScopeService,
  ) {}

  async monthlySummary(user: JwtPayload, year: number, month: number) {
    const scope = this.fleetScope.resolve(user);
    const fleetOwnerId = scope.fleetOwnerId;
    const vehicles = await this.vehiclesRepository.findAllActive(fleetOwnerId);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const summaries = await Promise.all(
      vehicles.map(async (vehicle) => {
        const [expenseData, hgsData, maintenanceRecords] = await Promise.all([
          this.expensesRepository.monthlyByCategory(vehicle.id, year, month),
          this.hgsRepository.monthlyTotal(vehicle.id, year, month),
          this.maintenanceRepository.findByVehicleAndPeriod(vehicle.id, start, end),
        ]);

        const totalExpenses = expenseData.reduce(
          (sum, e) => sum + Number(e._sum.amount ?? 0),
          0,
        );
        const maintenanceCost = maintenanceRecords.reduce(
          (sum, m) => sum + Number(m.cost),
          0,
        );

        return {
          vehicle,
          expenses: {
            total: totalExpenses,
            byCategory: expenseData.map((e) => ({
              category: e.category,
              amount: Number(e._sum.amount ?? 0),
              count: e._count,
            })),
          },
          hgs: {
            total: Number(hgsData._sum.amount ?? 0),
            transitCount: hgsData._count,
          },
          maintenance: {
            total: maintenanceCost,
            count: maintenanceRecords.length,
          },
        };
      }),
    );

    return {
      period: { year, month },
      vehicles: summaries,
      totals: {
        expenses: summaries.reduce((s, v) => s + v.expenses.total, 0),
        hgs: summaries.reduce((s, v) => s + v.hgs.total, 0),
        maintenance: summaries.reduce((s, v) => s + v.maintenance.total, 0),
      },
    };
  }

  async vehicleReport(user: JwtPayload, vehicleId: string, year: number, month: number) {
    const scope = this.fleetScope.resolve(user);
    const vehicle = await this.vehiclesRepository.findById(vehicleId, scope.fleetOwnerId);

    if (!vehicle) throw new NotFoundException(`Vehicle ${vehicleId} not found`);

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const [expenseData, hgsData, maintenanceRecords] = await Promise.all([
      this.expensesRepository.monthlyByCategory(vehicleId, year, month),
      this.hgsRepository.monthlyTotal(vehicleId, year, month),
      this.maintenanceRepository.findByVehicleAndPeriod(vehicleId, start, end),
    ]);

    const totalExpenses = expenseData.reduce((s, e) => s + Number(e._sum.amount ?? 0), 0);
    const maintenanceCost = maintenanceRecords.reduce((s, m) => s + Number(m.cost), 0);

    return {
      vehicle,
      period: { year, month },
      expenses: {
        total: totalExpenses,
        byCategory: expenseData.map((e) => ({
          category: e.category,
          amount: Number(e._sum.amount ?? 0),
        })),
      },
      hgs: {
        total: Number(hgsData._sum.amount ?? 0),
        transitCount: hgsData._count,
      },
      maintenance: {
        total: maintenanceCost,
        records: maintenanceRecords,
      },
    };
  }
}
