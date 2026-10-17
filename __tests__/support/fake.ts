// El `Fake` de Dart, en TypeScript.
//
// En f_market los falsos son `class X extends Fake implements IRepo`: se
// escriben solo los métodos que la prueba usa, y si el código llama a otro, la
// prueba falla diciendo cuál. Aquí lo mismo con un Proxy: lo que no se pasó
// lanza un error con su nombre en vez de devolver `undefined` en silencio.
export function fake<T extends object>(implemented: Partial<T>, name = "falso"): T {
  return new Proxy(implemented, {
    get(target, prop, receiver) {
      if (prop in target) return Reflect.get(target, prop, receiver);
      // Las promesas preguntan por `then`: un falso no es una promesa.
      if (prop === "then" || typeof prop === "symbol") return undefined;
      return () => {
        throw new Error(`${name}.${String(prop)} no está implementado en el falso de esta prueba`);
      };
    },
  }) as T;
}
