import { Config, DefaultRules, Rule } from '../config/typings';

type ArrayOfItems = { list: string[]; required: number }[];
function formatMessage(arr: ArrayOfItems): string {
  if (!arr.length) {
    return '';
  }
  return arr
    .map((item) => {
      return `- ${item.list.join(', ')} (${item.required} required out of ${
        item.list.length
      })`;
    })
    .join('\n');
}

function sortRules(rules: Rule[]): Rule[] {
  return [...rules].sort((a, b) => {
    return a.reviewers.length - b.reviewers.length;
  });
}
export function getMessage({
  fileChangesGroups,
  createdBy,
  rulesByCreator,
  defaultRules,
  reviewersToAssign,
}: {
  createdBy: string;
  rulesByCreator: Config['rulesByCreator'];
  defaultRules?: Config['defaultRules'];
  fileChangesGroups: string[];
  reviewersToAssign: string[];
}): string {
  const arr: ArrayOfItems = [];
  const used = new Set<string>();
  const rules = rulesByCreator[createdBy];
  if (!rules) {
    if (defaultRules) {
      const rulesByFileGroup = defaultRules.byFileGroups;
      fileChangesGroups.forEach((fileGroup) => {
        const rules = rulesByFileGroup[fileGroup];
        if (!rules) {
          return;
        }
        sortRules(rules).forEach((rule) => {
          const toAdd = rule.reviewers.reduce<string[]>((result, reviewer) => {
            if (!used.has(reviewer)) {
              used.add(reviewer);
              result.push(reviewer);
            }
            return result;
          }, []);
          const required = rule.required > toAdd.length ? toAdd.length : rule.required;
          arr.push({ list: toAdd, required });
        });
      });
    }
  } else {
    const fileChangesGroupsMap = fileChangesGroups.reduce<Record<string, string>>(
      (result, group) => {
        result[group] = group;
        return result;
      },
      {},
    );

    fileChangesGroups.forEach((fileGroup) => {
      sortRules(rules).forEach((rule) => {
        if (rule.ifChanged) {
          const matchFileChanges = rule.ifChanged.some((group) =>
            Boolean(fileChangesGroupsMap[group]),
          );
          if (!matchFileChanges) {
            return;
          }
        }
        const toAdd = rule.reviewers.reduce<string[]>((result, reviewer) => {
          if (!used.has(reviewer)) {
            used.add(reviewer);
            result.push(reviewer);
          }
          return result;
        }, []);
        const required = rule.required > toAdd.length ? toAdd.length : rule.required;
        arr.push({ list: toAdd, required });
      });
    });
  }

  const result = arr.filter(
    (item) =>
      item.required > 0 &&
      item.list.some((approver) => reviewersToAssign.includes(approver)),
  );
  return formatMessage(result);
}
