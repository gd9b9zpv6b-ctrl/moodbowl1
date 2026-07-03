// React hook wrapping SchoolEnergyConfig for reactive consumption in dashboards.

import { useCallback, useEffect, useState } from 'react';

import { ENERGY_BY_KEY, EnergyLevel } from '@/src/constants/energy';
import { EnergyMap, SchoolEnergyConfig } from '@/src/lib/school-energy-config';

export function useSchoolEnergyMap() {
  const [map, setMap] = useState<EnergyMap>(ENERGY_BY_KEY);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const m = await SchoolEnergyConfig.get();
    setMap(m);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const getLevel = useCallback(
    (key: string): EnergyLevel => map[key] || 'steady',
    [map],
  );

  return { map, loading, reload, getLevel };
}
