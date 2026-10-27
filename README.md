# r_market

Mercado de carros usados con React Native (Expo) y Roble (de Uninorte OpenLab)
como backend. Es la versión React Native de
[f_market](https://github.com/augustosalazar/f_market), construida sobre
[rn-uninorte-expo-template](https://github.com/augustosalazar/rn-uninorte-expo-template)
y con `roble-client`, siguiendo el skill `use-roble-client` de
[openlabun/skills](https://github.com/openlabun/skills).

Apunta al **mismo proyecto de Roble** que f_market, así que comparte esquema,
datos y consultas guardadas.

Lo que hace:

- **Catálogo público**, sin cuenta: búsqueda por texto, tira de marcas y filtros
  por marca, precio y año. Con cuenta, la búsqueda se resuelve en el servidor con
  la consulta guardada `market_search_listings`.
- **Publicar** un carro, con marca y modelo de un catálogo cerrado.
- **Seguir** una publicación con la estrella, **preguntar** en público y
  **chatear** en privado con el vendedor, con los mensajes en tiempo real.
- **Vender**: el vendedor elige al comprador entre quienes le escribieron, y
  después cada uno puede calificar al otro una vez.
- **Entrar sin cuenta**: un invitado puede seguir carros y preguntar (firma con
  el nombre que elige). Si luego guarda su cuenta, conserva todo lo que hizo.
- **Avisos** de preguntas, respuestas, cambios de estado y mensajes privados.

## Cómo correrlo

```bash
cp .env.example .env     # y llena EXPO_PUBLIC_ROBLE_CONTRACT_ID
npm install
npm start
```

Sin `.env` la app no arranca: muestra qué variables faltan y cómo arreglarlo.
Si cambias el `.env`, reinicia con `npx expo start --clear`.

Para comprobar la conexión antes de tocar la app:

```bash
npm run smoke
```

Registra una cuenta desechable, prueba árbol JSON, tiempo real, notificaciones e
invitado, y la borra al terminar.

| Comando | Qué hace |
|---|---|
| `npm start` | Servidor de desarrollo (Expo Go) |
| `npm run web` | La app en el navegador |
| `npm run test:ci` | Pruebas, una vez |
| `npm run typecheck` | TypeScript sin emitir |
| `npm run lint` | ESLint de Expo |
| `npm run smoke` | Verifica el proyecto de Roble del `.env` |

## Arquitectura

La del template: arquitectura limpia **por feature**, con inyección de
dependencias. La lógica de cada pantalla vive en su **view model** —un hook
(`useXxxViewModel`) o, si es estado global, un contexto—, que habla con la
**interfaz** del repositorio. No hay casos de uso.

```
App.tsx                 providers: DI, Paper, avisos, sesión, seguidos, bandeja
src/
  core/
    di/                 contenedor, tokens y appContainer (la raíz de composición)
    roble/              el cliente (uno solo), la config del .env y guardRoble
    feedback/           la barra de avisos (Snackbar)
    utils/ components/  formatos y componentes compartidos
  navigation/           stack raíz + pestañas, rutas tipadas, navigationRef
  features/
    auth/               sesión, login, registro, invitado, guardar cuenta
    listings/           catálogo, detalle, publicar, lo mío, seguir
    vehicles/           marcas y modelos precargados (solo lectura)
    qa/                 preguntas y respuestas públicas
    chat/               chats privados
    profiles/           perfil público, historial y calificaciones
    notifications/      bandeja de avisos
```

Cada feature repite las mismas capas:

```
features/<nombre>/
  domain/         entities, repositories (interfaces) y su Failure
  data/
    datasources/    la interfaz y la implementación remota: solo hablan con Roble
    repositories/   uno por feature: convierte filas en entidades y traduce errores
  presentation/   context/ o viewmodels/, screens/, components/
```

**Las llamadas a Roble viven solo en `data/datasources/`.** Lo único del paquete
que se nombra fuera son sus excepciones, que los repositorios traducen al
`Failure` de la feature con `guardRoble` (403 → «tu cuenta no puede hacer esto»;
404 al actualizar → «no existe o no es tuya»).

Los datasources hablan en **filas**, no en entidades: así cada repositorio se
prueba con un datasource falso que devuelve lo mismo que Roble.

## Diferencias con f_market

- **Avisos en Roble.** En f_market la bandeja vivía en memoria porque el paquete
  de Dart no traía notificaciones. `roble-client` sí (`db.notifications`): aquí
  los avisos se guardan en el servidor, llegan al momento a otros dispositivos y
  sobreviven al cerrar la app. Si un aviso no sale, la acción que lo provocó no
  falla.
- **Chat silenciado.** El aviso de un mensaje se omite cuando **quien recibe**
  silenció el hilo (`otherMuted`). f_market miraba el interruptor de quien envía.
- **Sin Google.** El proyecto no tiene proveedores encendidos y en React Native
  el login con Google necesita un SDK nativo (`signInWithIdToken`). Queda por
  añadir.
- **Exigir cuenta.** Cuando una acción exige cuenta, la app abre el login y la
  acción se repite al volver (en Flutter se esperaba el resultado de la ruta).
- **La regla de avisos de estado** está en un solo sitio
  (`listings/presentation/listingNotices.ts`) en vez de copiada en dos view models.

## El esquema en Roble

`roble.schema.desired.json` y `roble_queries/` son los de f_market: siete tablas
SQL (`listing`, `listing_question`, `listing_follow`, `chat_thread`, `car_brand`,
`car_model`, `user_rating`) y los mensajes en el árbol JSON
(`chat_message/<threadId>/<clave>`). Para administrar el proyecto con el MCP del
plugin, copia `.roble.mcp.env.example` como `.roble.mcp.env` (no va al
repositorio: lleva un token) y usa `roble_schema_plan` / `roble_schema_apply`.

## Pruebas

Son **las mismas pruebas de f_market**, una por una, para poder leerlas lado a
lado. Ninguna habla con Roble: usan falsos escritos a mano o los datasources en
memoria, que es lo único que cambia respecto a producción.

| Carpeta | Qué prueba | Cómo se corre |
|---|---|---|
| `__tests__/unit/<feature>/` | view models y repositorios | `npm run test:unit` |
| `__tests__/component/<feature>/` | una pantalla o un componente suelto | `npm run test:component` |
| `__tests__/integration/` | la app entera, con `createLocalContainer` | `npm run test:integration` |

`npm run test:ci` las corre todas. `__tests__/unit/sinRoble.test.ts` vigila la
regla: falla si una prueba usa el cliente de Roble, un `RemoteDataSource` o
`appContainer`.

### Archivo por archivo

| f_market (Flutter) | r_market (React Native) | Qué enseña |
|---|---|---|
| `test/unit/sin_roble_test.dart` | `unit/sinRoble.test.ts` | que ninguna prueba hable con el servidor |
| `test/unit/listings/listing_filter_test.dart` | `unit/listings/ListingFilter.test.ts` | dominio puro: sin nada falso |
| `test/unit/auth/session_view_model_test.dart` | `unit/auth/SessionViewModel.test.tsx` | un view model: validaciones y estado, con repositorio falso |
| `test/unit/auth/auth_repository_test.dart` | `unit/auth/AuthRepository.test.ts` | un repositorio: convertir filas y traducir errores, con fuente falsa |
| `test/unit/listings/listing_repository_test.dart` | `unit/listings/ListingRepository.test.ts` | lo mismo con publicaciones: precio en texto, orden, un 404 |
| `test/widget/core/missing_config_app_test.dart` | `component/core/MissingConfigScreen.test.tsx` | lo que se ve sin `.env` |
| `test/widget/listings/listing_card_test.dart` | `component/listings/ListingCard.test.tsx` | un componente sin estado: datos y funciones, nada falso |
| `test/widget/auth/login_page_test.dart` | `component/auth/LoginScreen.test.tsx` | una pantalla con su view model: errores visibles |
| `test/widget/listings/catalog_page_test.dart` | `component/listings/CatalogScreen.test.tsx` | una pantalla que lista datos: el repositorio falso anota lo que le piden |
| `integration_test/app_test.dart` | `integration/app.test.tsx` | la app entera con los datos en memoria |
| — | `unit/chat/ChatRepository.test.ts`, `unit/profiles/RatingRepository.test.ts`, `unit/core/formatters.test.ts` | extra: no están en f_market |

### Las piezas que cambian de nombre

| Flutter | React Native |
|---|---|
| *widget* (`StatelessWidget`, `StatefulWidget`) | *componente* (una función que devuelve JSX) |
| carpeta `ui/widgets/` | carpeta `presentation/components/` |
| *widget test* (`test/widget/`, `testWidgets`) | *component test* (`__tests__/component/`, `render` de Testing Library) |
| `class FakeX extends Fake implements IX` | `fake<X>({ ... })` (`__tests__/support/fake.ts`): lo no escrito lanza diciendo su nombre |
| `Get.put(SessionViewModel(fake))` | `renderHook(() => useSession(), { wrapper })` con el provider y un `Container` de falsos |
| `GetMaterialApp(home: LaPagina())` | `renderScreen(LaPantalla, container)` (`__tests__/support/renderScreen.tsx`) |
| `Key('login.submit')` y `find.byKey` | `testID="login.submit"` y `getByTestId` |
| `find.byTooltip('Dejar de seguir')` | `getByLabelText('Dejar de seguir')` (accesibilidad) |
| `tester.pump()` / `waitFor` propio | `findBy...` y `waitFor` de Testing Library |
| `Get.reset` en `tearDown` | un `DummyData` nuevo en cada prueba: no hay estado global |
| `LocalBindings` | `createLocalContainer()` (`src/core/di/localContainer.ts`) |
| `InMemory...DataSource` + `DummyData` | `...InMemoryDataSource` + `src/core/data/dummyData.ts` |

### Diferencias que vale la pena mirar

- **Las claves viven junto a la pantalla**, como en f_market:
  `LoginScreen.submitButtonKey`, `CatalogScreen.cardKey(id)`,
  `BrandStrip.chipKey('Kia')`, `HomeTabKeys.mine`. Una errata es un error de
  compilación.
- **Un view model de React no se construye: se monta.** Por eso el falso del
  repositorio de sesión tiene que contestar `restoreSession` y
  `onSessionExpired`, que el provider llama al montarse aunque la prueba no los
  mire. En la prueba de invitado, f_market escribía `user.value` a mano; un
  contexto no deja escribir su estado desde fuera, así que se llega por la acción
  real (`ensureWritableSession`).
- **`ListingFilter` no tiene `copyWith`.** En TypeScript se copia con `...` y
  `brand: null` sí borra la marca, así que las banderas `clear...` sobran.
- **El catálogo no necesita arrastrar la lista**: `FlatList` construye de entrada
  las primeras diez tarjetas, mientras que el `ListView` de Flutter solo las que
  caben en pantalla.
- **Las pruebas de Google no están**: r_market no tiene login con Google. La del
  409 se cambió por el choque que sí existe, el del ascenso de invitado.
- **La integración corre en Jest**, no en un dispositivo: los componentes nativos
  están simulados. El equivalente de `integration_test/` en un teléfono de verdad
  sería Maestro o Detox.
- **Las pestañas siguen montadas**, como el `IndexedStack`, pero Testing Library
  sí ve lo que está fuera de pantalla (Flutter lo saltaba). Por eso la prueba de
  invitado busca el carro seguido *dentro* de la lista de «Lo mío».

Al portarlas, dos de estas pruebas encontraron fallos de verdad en la app: una
sesión recuperada tarde podía borrar un login recién hecho, y el login borraba
sus propios errores en cuanto los pintaba. Los dos están corregidos.

### Correr la app sin servidor

```bash
npm run start:local
```

Arranca con `EXPO_PUBLIC_DATA_SOURCE=local`: los mismos repositorios con los
datasources en memoria, los carros de prueba con sus fotos, y la cuenta
`ana@demo.com` / `123456`. Se pierde todo al cerrar la app.
