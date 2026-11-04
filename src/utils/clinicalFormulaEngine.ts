/**
 * Clinical Formula Engine for Pathology & Diagnostic Laboratories
 * 
 * Safe mathematical parser and evaluator for clinical parameter calculations:
 * - Indirect Bilirubin, Globulin, A:G Ratio (LFT)
 * - Friedewald LDL, VLDL, TC:HDL, LDL:HDL (Lipid Profile)
 * - BUN, BUN:Creatinine Ratio (KFT)
 * - ANC, ALC, AEC, AMC, MCV, MCH, MCHC (Complete Hemogram)
 * - eGFR, Osmolality, Anion Gap, etc.
 * 
 * Strictly does NOT use eval() or Function constructor to ensure runtime safety.
 */

export interface FormulaEvaluationResult {
  value: number | null;
  displayValue: string;
  error?: string;
  formulaExpression: string;
}

export interface FormulaSyntaxCheck {
  isValid: boolean;
  error?: string;
  tokens: string[];
}

/**
 * Extracts all parameter tokens from formula expression, e.g. "[TBIL] - [DBIL]" -> ["TBIL", "DBIL"]
 */
export function extractFormulaTokens(expression: string): string[] {
  if (!expression || typeof expression !== 'string') return [];
  const regex = /\[([A-Za-z0-9_-]+)\]/g;
  const matches = new Set<string>();
  let match;
  while ((match = regex.exec(expression)) !== null) {
    if (match[1]) {
      matches.add(match[1].toUpperCase());
    }
  }
  return Array.from(matches);
}

/**
 * Validates the syntax of a formula expression without executing unsafe code
 */
export function validateFormulaSyntax(
  expression: string,
  availableCodes?: string[]
): FormulaSyntaxCheck {
  if (!expression || !expression.trim()) {
    return { isValid: false, error: 'Formula expression cannot be empty', tokens: [] };
  }

  const tokens = extractFormulaTokens(expression);
  if (tokens.length === 0) {
    return { isValid: false, error: 'Formula must contain at least one parameter token like [PARAM_CODE]', tokens: [] };
  }

  // Check if any referenced parameter is unknown (if list provided)
  if (availableCodes && availableCodes.length > 0) {
    const validSet = new Set(availableCodes.map((c) => c.toUpperCase()));
    const missing = tokens.filter((t) => !validSet.has(t));
    if (missing.length > 0) {
      return {
        isValid: false,
        error: `Unknown parameter token(s): ${missing.join(', ')}`,
        tokens,
      };
    }
  }

  // Check balanced parentheses
  let openCount = 0;
  for (let i = 0; i < expression.length; i++) {
    if (expression[i] === '(') openCount++;
    if (expression[i] === ')') openCount--;
    if (openCount < 0) {
      return { isValid: false, error: 'Unbalanced closing parenthesis ")" found', tokens };
    }
  }
  if (openCount !== 0) {
    return { isValid: false, error: 'Unbalanced opening parenthesis "(" missing match', tokens };
  }

  // Check valid characters: only [A-Za-z0-9_-], +, -, *, /, (, ), ., and spaces allowed
  const sanitized = expression.replace(/\[[A-Za-z0-9_-]+\]/g, ' 1 ');
  if (!/^[0-9+\-*/().\s]+$/.test(sanitized)) {
    return { isValid: false, error: 'Formula contains unsupported special characters', tokens };
  }

  // Dry-run evaluate with sample number 1 to test mathematical syntax
  try {
    const testResult = evaluateMathString(sanitized);
    if (typeof testResult !== 'number' || isNaN(testResult)) {
      return { isValid: false, error: 'Invalid mathematical expression syntax', tokens };
    }
  } catch (err: any) {
    return { isValid: false, error: err.message || 'Syntax error in calculation', tokens };
  }

  return { isValid: true, tokens };
}

/**
 * Evaluates a formula with real parameter values
 * @param expression E.g. "[TBIL] - [DBIL]"
 * @param parameterValues E.g. { "TBIL": 2.4, "DBIL": 0.8 }
 * @param decimalPlaces Precision for rounding (default: 2)
 */
export function evaluateFormula(
  expression: string,
  parameterValues: Record<string, number | string | undefined | null>,
  decimalPlaces = 2
): FormulaEvaluationResult {
  if (!expression || !expression.trim()) {
    return { value: null, displayValue: '', formulaExpression: expression, error: 'Empty formula' };
  }

  const tokens = extractFormulaTokens(expression);
  if (tokens.length === 0) {
    return { value: null, displayValue: '', formulaExpression: expression, error: 'No tokens found' };
  }

  // Normalize parameter keys to upper case for robust matching
  const normalizedValues: Record<string, number> = {};
  Object.keys(parameterValues).forEach((key) => {
    const raw = parameterValues[key];
    if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
      const num = Number(String(raw).trim().replace(/[^0-9.-]/g, ''));
      if (!isNaN(num)) {
        normalizedValues[key.toUpperCase()] = num;
      }
    }
  });

  // Check if all required tokens have valid numeric inputs
  const missingTokens: string[] = [];
  for (const t of tokens) {
    if (normalizedValues[t] === undefined) {
      missingTokens.push(t);
    }
  }

  if (missingTokens.length > 0) {
    return {
      value: null,
      displayValue: '',
      formulaExpression: expression,
      error: `Waiting for: ${missingTokens.join(', ')}`,
    };
  }

  // Replace tokens with values
  let mathStr = expression;
  tokens.forEach((t) => {
    const val = normalizedValues[t];
    // Use regex with exact token match
    const regex = new RegExp(`\\[${t}\\]`, 'gi');
    mathStr = mathStr.replace(regex, `(${val})`);
  });

  try {
    const numResult = evaluateMathString(mathStr);

    if (numResult === null || isNaN(numResult)) {
      return { value: null, displayValue: '', formulaExpression: expression, error: 'Invalid calculation result' };
    }

    if (!isFinite(numResult)) {
      return { value: null, displayValue: 'DIV/0', formulaExpression: expression, error: 'Division by zero' };
    }

    const multiplier = Math.pow(10, Math.max(0, decimalPlaces));
    const rounded = Math.round(numResult * multiplier) / multiplier;
    const displayValue = rounded.toFixed(Math.max(0, decimalPlaces));

    return {
      value: rounded,
      displayValue,
      formulaExpression: expression,
    };
  } catch (err: any) {
    return {
      value: null,
      displayValue: '',
      formulaExpression: expression,
      error: err.message || 'Math evaluation error',
    };
  }
}

/**
 * Pure mathematical parser & evaluator using Shunting-Yard + RPN evaluation.
 * Completely immune to code injection / no eval().
 */
export function evaluateMathString(input: string): number {
  const tokens = tokenizeMath(input);
  const rpn = shuntingYard(tokens);
  return evaluateRPN(rpn);
}

function tokenizeMath(str: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < str.length) {
    const char = str[i];
    if (/\s/.test(char)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(char)) {
      let numStr = '';
      while (i < str.length && /[0-9.]/.test(str[i])) {
        numStr += str[i];
        i++;
      }
      tokens.push(numStr);
      continue;
    }
    if (['+', '-', '*', '/', '(', ')'].includes(char)) {
      // Check for unary minus: e.g. at start or after another operator or '('
      if (char === '-') {
        const prev = tokens[tokens.length - 1];
        if (!prev || ['+', '-', '*', '/', '('].includes(prev)) {
          // It's a unary negative sign, peek next number
          i++;
          while (i < str.length && /\s/.test(str[i])) i++;
          let numStr = '-';
          while (i < str.length && /[0-9.]/.test(str[i])) {
            numStr += str[i];
            i++;
          }
          if (numStr === '-') {
            tokens.push('0');
            tokens.push('-');
          } else {
            tokens.push(numStr);
          }
          continue;
        }
      }
      tokens.push(char);
      i++;
      continue;
    }
    throw new Error(`Unexpected character: "${char}" in math formula`);
  }
  return tokens;
}

function shuntingYard(tokens: string[]): string[] {
  const outputQueue: string[] = [];
  const operatorStack: string[] = [];

  const precedence: Record<string, number> = {
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2,
  };

  tokens.forEach((token) => {
    if (!isNaN(Number(token))) {
      outputQueue.push(token);
    } else if (['+', '-', '*', '/'].includes(token)) {
      while (
        operatorStack.length > 0 &&
        operatorStack[operatorStack.length - 1] !== '(' &&
        precedence[operatorStack[operatorStack.length - 1]] >= precedence[token]
      ) {
        outputQueue.push(operatorStack.pop()!);
      }
      operatorStack.push(token);
    } else if (token === '(') {
      operatorStack.push(token);
    } else if (token === ')') {
      while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
        outputQueue.push(operatorStack.pop()!);
      }
      if (operatorStack.length === 0) {
        throw new Error('Mismatched parentheses');
      }
      operatorStack.pop(); // Pop the '('
    }
  });

  while (operatorStack.length > 0) {
    const op = operatorStack.pop()!;
    if (op === '(' || op === ')') {
      throw new Error('Mismatched parentheses');
    }
    outputQueue.push(op);
  }

  return outputQueue;
}

function evaluateRPN(rpn: string[]): number {
  const stack: number[] = [];

  rpn.forEach((token) => {
    if (!isNaN(Number(token))) {
      stack.push(Number(token));
    } else if (['+', '-', '*', '/'].includes(token)) {
      if (stack.length < 2) {
        throw new Error('Invalid math expression syntax');
      }
      const b = stack.pop()!;
      const a = stack.pop()!;
      let res: number;
      switch (token) {
        case '+':
          res = a + b;
          break;
        case '-':
          res = a - b;
          break;
        case '*':
          res = a * b;
          break;
        case '/':
          if (b === 0) {
            return Infinity;
          }
          res = a / b;
          break;
        default:
          throw new Error(`Unknown operator ${token}`);
      }
      stack.push(res);
    }
  });

  if (stack.length !== 1) {
    throw new Error('Failed to evaluate formula expression');
  }

  return stack[0];
}
