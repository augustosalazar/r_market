export class ChatFailure extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChatFailure";
  }
}
