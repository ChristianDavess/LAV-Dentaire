'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, DollarSign, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { DashboardStats } from '@/types';

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Patients',
      value: stats.totalPatients.toString(),
      icon: Users,
      description: 'Approved patients',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: "Today's Appointments",
      value: stats.todaysAppointments.toString(),
      icon: Calendar,
      description: 'Scheduled for today',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(stats.monthlyRevenue),
      icon: DollarSign,
      description: 'This month',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Pending Registrations',
      value: stats.pendingRegistrations.toString(),
      icon: Clock,
      description: 'Awaiting approval',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}