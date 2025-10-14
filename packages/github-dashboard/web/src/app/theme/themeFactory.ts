import { createTheme, Theme } from '@mui/material/styles';
import { baseTheme } from './baseTheme';
import { basicTheme } from './basicTheme';
import { premiumTheme } from './premiumTheme';

export type TierType = 'neutral' | 'basic' | 'premium';

export function createTierTheme(tierType: TierType): Theme {
  let themeOptions;
  
  switch (tierType) {
    case 'neutral':
      themeOptions = baseTheme;
      break;
    case 'premium':
      themeOptions = premiumTheme;
      break;
    case 'basic':
    default:
      themeOptions = basicTheme;
      break;
  }
  
  return createTheme(themeOptions);
}

