
type StatType = 'affection' | 'Possessiveness' | 'Intimacy' | 'Obsession';

interface CharacterStats {
  affection: number;
  Possessiveness: number;
  Obsession: number;
  Intimacy: number;
  [key: string]: any;
}

export const calculateNewStats = (
  current: CharacterStats, 
  aiSuggested: CharacterStats
): CharacterStats => {
  
  const finalStats = { ...current };
  
  const statKeys: StatType[] = ['affection', 'Possessiveness', 'Intimacy', 'Obsession'];

  statKeys.forEach(key => {
    const oldVal = current[key] || 0;
    const aiVal = aiSuggested[key] || 0;
    
    if (aiVal === oldVal) return;

    const rawDelta = aiVal - oldVal;
    let finalDelta = rawDelta;

    if (key === 'Obsession') {
      finalDelta = rawDelta * 0.1; 
    } else {
      let resistance = 1.0; 

      if (rawDelta > 0) {
        if (oldVal < 30) {
           resistance = 1.0; 
        } else if (oldVal >= 30 && oldVal < 60) {
           resistance = 0.8; 
        } else if (oldVal >= 60 && oldVal < 75) {
           resistance = 0.5; 
        } else if (oldVal >= 75 && oldVal < 90) {
           resistance = 0.2; 
        } else if (oldVal >= 90) {
           resistance = 0.05; 
        }
      } else {
        if (oldVal > 80) resistance = 0.2; 
        else if (oldVal > 50) resistance = 0.5;
        else resistance = 1.0;
      }

      finalDelta = rawDelta * resistance;
    }

    let newVal = oldVal + finalDelta;

    const isLimitBreak = oldVal >= 90 && rawDelta > 20;
    if (!isLimitBreak) {
        newVal = Math.min(newVal, 100);
    }
    newVal = Math.max(newVal, 0); 

    finalStats[key] = parseFloat(newVal.toFixed(1));
  });

  return finalStats;
};