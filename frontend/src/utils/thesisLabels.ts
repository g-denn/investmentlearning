export function getThesisDirectionLabel(isShort: boolean): string {
  return isShort ? 'Bearish thesis' : 'Bullish thesis';
}

export function getThesisDirectionHint(isShort: boolean): string {
  return isShort ? 'The original idea expected the stock to fall.' : 'The original idea expected the stock to rise.';
}
