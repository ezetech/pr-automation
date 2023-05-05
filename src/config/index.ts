import * as Joi from 'joi';
import { Config } from './typings';

const schema = Joi.object<Config>()
  .keys({
    options: Joi.object({
      ignoredLabels: Joi.array().items(Joi.string()).optional(),
      ignoreReassignForMergedPRs: Joi.boolean().optional(),
      requiredChecks: Joi.array().items(Joi.string()),
      withMessage: {
        messageId: Joi.string().optional(),
      },
    }).optional(),
    defaultRules: Joi.object({
      byFileGroups: Joi.object().pattern(
        Joi.string(),
        Joi.array().items(
          Joi.object({
            reviewers: Joi.array().items(Joi.string()).required(),
            required: Joi.number().required(),
            assign: Joi.number().optional(),
          }),
        ),
      ),
    }).optional(),
    rulesByCreator: Joi.object()
      .pattern(
        Joi.string(),
        Joi.array().items(
          Joi.object({
            reviewers: Joi.array().items(Joi.string()).required(),
            required: Joi.number().required(),
            assign: Joi.number().optional(),
            ifChanged: Joi.array().items(Joi.string()).optional(),
          }),
        ),
      )
      .required(),
    fileChangesGroups: Joi.object()
      .pattern(Joi.string(), Joi.array().items(Joi.string()))
      .required(),
    sageUsers: Joi.object()
      .pattern(
        Joi.string(),
        Joi.array().items(
          Joi.object({
            email: Joi.string().required(),
          }),
        ),
      )
      .optional(),
  })
  .required()
  .options({ stripUnknown: true });

export function validateConfig(configJson: Record<string, unknown>): Config {
  const { error, value } = schema.validate(configJson);
  if (error) {
    throw new Error(JSON.stringify(error.details));
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return value!;
}
