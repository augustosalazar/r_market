import fs from "fs";
import path from "path";

// Las pruebas no hablan con Roble: probar el servidor no es trabajo de esta
// app. Corren con datasources falsos o en memoria, sin red y sin cuenta.
//
// Esto lo vigila en vez de confiar en que nadie se equivoque de import: una
// prueba que construye el cliente de verdad se cuela fácil, y el síntoma —fallos
// de red o falta de `.env`— sale lejos de la causa.
//
// Importar `roble-client` **sí** está permitido: los repositorios traducen sus
// excepciones, y probar esa traducción exige lanzar una. Lanzar un
// `RobleApiNotFoundException` no sale a la red; construir un `RobleApiClient`, sí.
const forbidden: Record<string, string> = {
  "core/roble/RobleClient": "el cliente de Roble de la app",
  RemoteDataSource: "un datasource que habla con el servidor",
  "core/di/appContainer": "las dependencias de producción, que usan Roble",
  "new RobleApiClient(": "un cliente de Roble construido a mano",
};

function testFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return testFiles(full);
    return /\.test\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

test("ninguna prueba usa el servidor de Roble", () => {
  const files = testFiles(path.join(__dirname, ".."))
    // Este archivo nombra lo prohibido para poder buscarlo.
    .filter((f) => !f.endsWith("sinRoble.test.ts"));

  const violations = files.flatMap((file) => {
    const source = fs.readFileSync(file, "utf8");
    return Object.entries(forbidden)
      .filter(([pattern]) => source.includes(pattern))
      .map(([pattern, what]) => `${path.relative(process.cwd(), file)}: usa ${what} (${pattern}). Usa los datasources en memoria.`);
  });

  expect(violations).toEqual([]);
});
