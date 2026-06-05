/**
 * Valida un número de DUI (Documento Único de Identidad) de El Salvador.
 * Algoritmo oficial Mod-10 complementario.
 * Formato esperado: 00000000-0
 */
export const validateDUI = (dui) => {
  const cleanDUI = dui.replace(/\D/g, '');
  if (cleanDUI.length !== 9) return false;

  const digits = cleanDUI.split('').map(Number);
  const verifyDigit = digits[8];

  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += digits[i] * (9 - i);
  }

  const mod = sum % 10;
  const calculatedDigit = mod === 0 ? 0 : 10 - mod;

  return calculatedDigit === verifyDigit;
};

/**
 * Valida un número de NIT (Número de Identificación Tributaria) de El Salvador.
 * Formato esperado: 0000-000000-000-0
 */
export const validateNIT = (nit) => {
  const cleanNIT = nit.replace(/\D/g, '');
  if (cleanNIT.length !== 14) return false;

  const digits = cleanNIT.split('').map(Number);
  const verifyDigit = digits[13];

  let sum = 0;
  // Si el penúltimo grupo es menor o igual a 100, se utiliza una fórmula, de lo contrario otra
  const nitType = parseInt(cleanNIT.slice(10, 13));

  if (nitType <= 100) {
    for (let i = 0; i < 13; i++) {
      sum += digits[i] * (14 - i);
    }
    const mod = sum % 11;
    const calculatedDigit = mod === 10 ? 0 : mod;
    return calculatedDigit === verifyDigit;
  } else {
    for (let i = 0; i < 13; i++) {
      sum += digits[i] * (((i + 1) % 2 === 0) ? 1 : 2); // Algoritmo Luhn adaptado
    }
    const mod = sum % 10;
    const calculatedDigit = mod === 0 ? 0 : 10 - mod;
    return calculatedDigit === verifyDigit;
  }
};

/**
 * Formatea dinámicamente un valor al formato de DUI (00000000-0)
 */
export const formatDUI = (value) => {
  const numbers = value.replace(/\D/g, '').slice(0, 9);
  if (numbers.length > 8) {
    return `${numbers.slice(0, 8)}-${numbers.slice(8)}`;
  }
  return numbers;
};

/**
 * Formatea dinámicamente un valor al formato de NIT (0000-000000-000-0)
 */
export const formatNIT = (value) => {
  const numbers = value.replace(/\D/g, '').slice(0, 14);
  if (numbers.length > 13) {
    return `${numbers.slice(0, 4)}-${numbers.slice(4, 10)}-${numbers.slice(10, 13)}-${numbers.slice(13)}`;
  }
  if (numbers.length > 10) {
    return `${numbers.slice(0, 4)}-${numbers.slice(4, 10)}-${numbers.slice(10)}`;
  }
  if (numbers.length > 4) {
    return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
  }
  return numbers;
};

/**
 * Formatea dinámicamente un número telefónico al formato internacional de El Salvador (+503 0000 0000)
 */
export const formatTelefono = (value) => {
  const cleanValue = value.startsWith('+503') ? value.slice(4) : value;
  const numbers = cleanValue.replace(/\D/g, '').slice(0, 8);
  
  if (numbers.length === 0) return '';
  
  let formatted = '+503 ';
  if (numbers.length > 4) {
    formatted += `${numbers.slice(0, 4)} ${numbers.slice(4)}`;
  } else {
    formatted += numbers;
  }
  return formatted;
};
