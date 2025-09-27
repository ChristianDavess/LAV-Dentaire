'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface RevenueData {
  month: string;
  revenue: number;
}

export function RevenueChart() {
  const [data, setData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    const supabase = createClient();
    
    try {
      // Get last 6 months of data
      const months: RevenueData[] = [];
      const today = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
        
        const { data: treatments } = await supabase
          .from('treatments')
          .select('total_amount')
          .gte('treatment_date', date.toISOString())
          .lt('treatment_date', nextMonth.toISOString())
          .eq('payment_status', 'paid');
        
        const revenue = treatments?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;
        
        months.push({
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          revenue,
        });
      }
      
      setData(months);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="h-[350px] flex items-center justify-center">Loading...</div>;
  }

  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);

  return (
    <div className="h-[350px] w-full">
      <div className="flex h-full items-end justify-between gap-2">
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full bg-gray-100 rounded-t-md relative flex-1 max-h-[280px]">
              <div
                className="absolute bottom-0 w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md transition-all duration-500"
                style={{
                  height: `${(item.revenue / maxRevenue) * 100}%`,
                }}
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold whitespace-nowrap">
                  {formatCurrency(item.revenue)}
                </div>
              </div>
            </div>
            <span className="text-sm text-muted-foreground">{item.month}</span>
          </div>
        ))}
      </div>
    </div>
  );
}