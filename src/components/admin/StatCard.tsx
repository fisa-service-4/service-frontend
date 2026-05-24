import { StatCard as StatCardType } from '@/types/admin';

interface StatCardProps {
  card: StatCardType;
}

export default function StatCard({ card }: StatCardProps) {
  return (
    <div className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-4 shadow-lg hover:shadow-xl transition-shadow`}>
      <div className="flex items-center justify-between mb-2">
        <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
          {card.icon}
        </div>
      </div>
      <div className="text-white">
        <div className="text-2xl font-bold mb-1">{card.value}</div>
        <div className="text-xs text-white/80">{card.title}</div>
      </div>
    </div>
  );
}
