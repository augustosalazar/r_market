export class QaFailure extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QaFailure";
  }
}
