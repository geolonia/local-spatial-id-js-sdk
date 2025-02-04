export class ConversionNotPossibleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConversionNotPossibleError";
  }
}
