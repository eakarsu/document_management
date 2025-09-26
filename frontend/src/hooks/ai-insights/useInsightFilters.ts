import { useState, useMemo } from 'react';
import { Insight } from '../../types/ai-insights';

export const useInsightFilters = (insights: Insight[]) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');

  const filteredInsights = useMemo(() => {
    return insights.filter(insight => {
      if (filterType !== 'ALL' && insight.type !== filterType) return false;
      if (filterPriority !== 'ALL' && insight.priority !== filterPriority) return false;
      return true;
    });
  }, [insights, filterType, filterPriority]);

  const criticalInsights = useMemo(() =>
    insights.filter(i => i.priority === 'CRITICAL').length,
    [insights]
  );

  const actionableInsights = useMemo(() =>
    insights.filter(i => i.actionable).length,
    [insights]
  );

  return {
    filterType,
    setFilterType,
    filterPriority,
    setFilterPriority,
    filteredInsights,
    criticalInsights,
    actionableInsights
  };
};