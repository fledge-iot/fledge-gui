import { Jexl } from 'jexl';

const evaluator = new Jexl();

export type ValidityContext = Record<string, string>;

export function buildValidityContext(configuration: Record<string, { value?: unknown }>): ValidityContext {
  const context: ValidityContext = {};
  Object.keys(configuration).forEach(key => {
    context[key] = String(configuration[key].value);
  });
  return context;
}

function rejectingUnknownKeys(context: ValidityContext): ValidityContext {
  return new Proxy(context, {
    get(target, key) {
      if (typeof key === 'string' && !Object.prototype.hasOwnProperty.call(target, key)) {
        throw new ReferenceError(`${key} is not a configuration item`);
      }
      return target[key as string];
    }
  });
}

export function isValidityExpressionSatisfied(expression: string, context: ValidityContext): boolean {
  try {
    return evaluator.evalSync(expression, rejectingUnknownKeys(context)) !== false;
  } catch (error) {
    console.log('Validity expression', expression, 'failed to evaluate', error);
    return true;
  }
}
