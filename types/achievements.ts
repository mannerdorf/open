export type AchievementCategory = 'weight' | 'volume' | 'geography' | 'loyalty' | 'distance' | 'activity';

export type AchievementStatus = 'locked' | 'in_progress' | 'completed';

export interface Achievement {
  id: string;
  category: AchievementCategory;
  title: string;
  description: string;
  icon: string;
  status: AchievementStatus;
  progress: number;
  target: number;
  unit: string;
  color: string;
  earnedAt?: string;
}

export interface AchievementProgress {
  totalWeight: number;
  totalVolume: number;
  totalDistance: number;
  totalShipments: number;
  uniqueRoutes: Set<string>;
  firstShipmentDate?: string;
  consecutiveQuarters: number;
  onlineOrdersPercent: number;
}
