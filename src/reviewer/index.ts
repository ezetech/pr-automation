import { withDebugLog } from '../utils';
import {
  shouldRequestReview as shouldRequestReviewFunc,
  identifyReviewers as identifyReviewersFunc,
  identifyFileChangeGroups as identifyFileChangeGroupsFunc,
} from './reviewer';
import { getMessage as getMessageFunc } from './get-message';
export const shouldRequestReview = withDebugLog(shouldRequestReviewFunc);
export const identifyReviewers = withDebugLog(identifyReviewersFunc);
export const identifyFileChangeGroups = withDebugLog(identifyFileChangeGroupsFunc);
export const getMessage = withDebugLog(getMessageFunc);
