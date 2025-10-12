import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Achievement, AchievementProgress } from '@/types/achievements';
import { achievementDefinitions } from '@/mocks/achievements';
import { useCompanies } from './CompanyContext';

interface AchievementsContextValue {
  achievements: Achievement[];
  progress: AchievementProgress;
  completedCount: number;
  totalCount: number;
}

const AchievementsContext = createContext<AchievementsContextValue | undefined>(undefined);

export function AchievementsProvider({ children }: { children: ReactNode }) {
  const { orders } = useCompanies();

  const progress = useMemo<AchievementProgress>(() => {
    const totalWeight = orders.reduce((sum, o) => sum + (o.cargo?.weightKg ?? 0), 0);
    const totalVolume = orders.reduce((sum, o) => sum + (o.cargo?.volumeM3 ?? 0), 0);
    
    const routeDistances: Record<string, number> = {
      'Москва-Санкт-Петербург': 700,
      'Санкт-Петербург-Москва': 700,
      'Москва-Калининград': 1200,
      'Калининград-Москва': 1200,
      'Москва-Ростов-на-Дону': 1100,
      'Ростов-на-Дону-Москва': 1100,
      'Москва-Екатеринбург': 1800,
      'Екатеринбург-Москва': 1800,
      'Санкт-Петербург-Калининград': 800,
      'Калининград-Санкт-Петербург': 800,
    };

    const totalDistance = orders.reduce((sum, o) => {
      const route = `${o.route.from.city}-${o.route.to.city}`;
      return sum + (routeDistances[route] ?? 500);
    }, 0);

    const uniqueRoutes = new Set<string>();
    orders.forEach(o => {
      const route = `${o.route.from.city}-${o.route.to.city}`;
      uniqueRoutes.add(route);
    });

    const sortedOrders = [...orders].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const firstShipmentDate = sortedOrders.length > 0 ? sortedOrders[0].createdAt : undefined;

    const quarters = new Set<string>();
    orders.forEach(o => {
      const date = new Date(o.createdAt);
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      const year = date.getFullYear();
      quarters.add(`${year}-Q${quarter}`);
    });

    const onlineOrdersPercent = orders.length > 0 ? 100 : 0;

    return {
      totalWeight,
      totalVolume,
      totalDistance,
      totalShipments: orders.length,
      uniqueRoutes,
      firstShipmentDate,
      consecutiveQuarters: quarters.size,
      onlineOrdersPercent,
    };
  }, [orders]);

  const achievements = useMemo<Achievement[]>(() => {
    const currentDate = new Date();
    const firstDate = progress.firstShipmentDate ? new Date(progress.firstShipmentDate) : currentDate;
    const daysSinceFirst = Math.floor((currentDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));

    const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthOrders = orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= currentMonth;
    });
    const monthWeight = monthOrders.reduce((sum, o) => sum + (o.cargo?.weightKg ?? 0), 0);

    const kgdRoutes = orders.filter(o => 
      (o.route.from.city.includes('Калининград') || o.route.to.city.includes('Калининград'))
    ).length;

    return achievementDefinitions.map(def => {
      let currentProgress = 0;
      let status: Achievement['status'] = 'locked';

      switch (def.id) {
        case 'weight_10t_month':
          currentProgress = monthWeight;
          break;
        case 'weight_100t_total':
          currentProgress = progress.totalWeight;
          break;
        case 'volume_10_containers':
          currentProgress = progress.totalVolume;
          break;
        case 'volume_1000m3_total':
          currentProgress = progress.totalVolume;
          break;
        case 'route_kgd_100':
          currentProgress = kgdRoutes;
          break;
        case 'loyalty_1year':
        case 'loyalty_3years':
        case 'loyalty_5years':
          currentProgress = daysSinceFirst;
          break;
        case 'loyalty_first':
          currentProgress = progress.totalShipments > 0 ? 1 : 0;
          break;
        case 'activity_quarterly':
          currentProgress = progress.consecutiveQuarters;
          break;
        case 'activity_online':
          currentProgress = progress.onlineOrdersPercent;
          break;
        case 'distance_equator':
        case 'distance_moon':
          currentProgress = progress.totalDistance;
          break;
      }

      if (currentProgress >= def.target) {
        status = 'completed';
      } else if (currentProgress > 0) {
        status = 'in_progress';
      }

      return {
        ...def,
        status,
        progress: currentProgress,
        earnedAt: status === 'completed' ? currentDate.toISOString() : undefined,
      };
    });
  }, [progress, orders]);

  const completedCount = achievements.filter(a => a.status === 'completed').length;
  const totalCount = achievements.length;

  const value: AchievementsContextValue = {
    achievements,
    progress,
    completedCount,
    totalCount,
  };

  return (
    <AchievementsContext.Provider value={value}>
      {children}
    </AchievementsContext.Provider>
  );
}

export function useAchievements() {
  const context = useContext(AchievementsContext);
  if (!context) {
    throw new Error('useAchievements must be used within AchievementsProvider');
  }
  return context;
}
