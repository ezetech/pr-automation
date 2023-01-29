import { withDebugLog } from '../utils';
import {
  shouldRequestReview as shouldRequestReviewFunc,
  identifyReviewers as identifyReviewersFunc,
  identifyFileChangeGroups as identifyFileChangeGroupsFunc,
} from './reviewer';

export const shouldRequestReview = withDebugLog(shouldRequestReviewFunc);
export const identifyReviewers = withDebugLog(identifyReviewersFunc);
export const identifyFileChangeGroups = withDebugLog(identifyFileChangeGroupsFunc);
