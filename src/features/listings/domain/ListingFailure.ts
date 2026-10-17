// Lo que la feature entiende cuando el servidor dice que no.
export class ListingFailure extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ListingFailure";
  }
}
