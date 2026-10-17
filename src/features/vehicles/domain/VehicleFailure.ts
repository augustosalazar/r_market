export class VehicleFailure extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VehicleFailure";
  }
}
