import { withDebugLog } from '../utils';

import { getEmployeesWhoAreOutToday as getEmployeesWhoAreOutTodayFunc } from './sage';

export const getEmployeesWhoAreOutToday = withDebugLog(getEmployeesWhoAreOutTodayFunc);
