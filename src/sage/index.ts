import { withDebugLog } from '../utils';

import {
  filterReviewersWhoDontWorkToday as filterReviewersWhoDontWorkTodayFunc,
} from './sage';

export const filterReviewersWhoDontWorkToday = withDebugLog(filterReviewersWhoDontWorkTodayFunc);
