// Las ilustraciones de los carros de prueba (`dummyData.ts`). Hacen las veces de
// las fotos que subiría un vendedor, sin depender de la red.
//
// En Flutter bastaba `Image.asset('assets/cars/...')`; Metro necesita cada
// `require` escrito tal cual, así que la ruta se traduce con este mapa.
export const carAssets: Record<string, number> = {
  "assets/cars/mazda3_0.png": require("../../../assets/cars/mazda3_0.png"),
  "assets/cars/mazda3_1.png": require("../../../assets/cars/mazda3_1.png"),
  "assets/cars/mazda3_2.png": require("../../../assets/cars/mazda3_2.png"),
  "assets/cars/duster_0.png": require("../../../assets/cars/duster_0.png"),
  "assets/cars/duster_1.png": require("../../../assets/cars/duster_1.png"),
  "assets/cars/onix_0.png": require("../../../assets/cars/onix_0.png"),
  "assets/cars/corolla_0.png": require("../../../assets/cars/corolla_0.png"),
  "assets/cars/corolla_1.png": require("../../../assets/cars/corolla_1.png"),
  "assets/cars/picanto_0.png": require("../../../assets/cars/picanto_0.png"),
  "assets/cars/picanto_1.png": require("../../../assets/cars/picanto_1.png"),
};
