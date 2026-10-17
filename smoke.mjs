import {
  RobleAnonKeyScopeException,
  RobleAnonymousAuthException,
  RobleApiClient,
} from 'roble-client';

const BASE = process.env.ROBLE_BASE_URL ?? 'https://roble-api.test-openlab.uninorte.edu.co';
const CONTRACT = process.env.ROBLE_CONTRACT_ID;
if (!CONTRACT) { console.error('Falta ROBLE_CONTRACT_ID'); process.exit(1); }

const memoria = new Map();
const db = new RobleApiClient({
  baseUrl: BASE, contractId: CONTRACT,
  storage: { getItem: (k) => memoria.get(k) ?? null,
             setItem: (k, v) => memoria.set(k, v),
             removeItem: (k) => memoria.delete(k) },
});

const ok = (m) => console.log('  ok  ', m);
let creado = false;

try {
  console.log('sin sesión');
  ok(`proveedores: ${(await db.listProviders()).map((p) => p.name).join(', ') || '(ninguno)'}`);

  const correo = `smoke-${Date.now()}@ejemplo.test`;
  console.log('cuenta desechable');
  await db.register({ email: correo, password: 'SmokeClave!1', name: 'Smoke' });
  creado = true;
  ok(`registrada ${correo}`);

  const user = await db.login({ email: correo, password: 'SmokeClave!1' });
  ok(`login -> userId=${user.userId} role=${user.role ?? 'null'}`);

  console.log('árbol JSON');
  const col = `_smoke_${Date.now()}`;

  // El primer push va antes de escuchar a propósito: el servidor rechaza
  // suscribirse a una colección que todavía no existe, con
  // REALTIME_UNKNOWN_COLLECTION, y una colección nace al escribir en ella. Al
  // revés, el smoke se suscribía a algo inexistente y el «no llegó ningún
  // cambio» parecía un fallo de tiempo real cuando era de orden.
  const id = await db.json.push(col, { texto: 'hola' });
  ok(`push -> ${id}`);
  ok(`read -> ${JSON.stringify(await db.json.read(col))}`);

  const recibidos = [];
  const errores = [];
  // onError va dentro del objeto de opciones: pasarlo suelto como tercer
  // argumento no lo registra, y un rechazo del servidor se pierde en silencio.
  const parar = db.json.watch(col, (c) => recibidos.push(c), {
    onError: (e) => errores.push(e),
  });
  await new Promise((r) => setTimeout(r, 1500));      // deja abrir el socket

  const id2 = await db.json.push(col, { texto: 'y este es el que se espera por el socket' });

  await new Promise((r) => setTimeout(r, 2500));      // deja llegar el evento
  if (errores.length) {
    console.log(`  AVISO tiempo real: ${errores[0]?.message ?? errores[0]}`);
  }
  console.log(recibidos.length ? '  ok   tiempo real: llegó el cambio'
                               : '  AVISO tiempo real: no llegó ningún cambio');
  parar();

  // Se borran las ramas, no la colección: `remove(col)` —un solo segmento— la
  // vacía entera y eso es de administradores. Que aquí responda 403 con una
  // cuenta recién registrada es la prueba de que esa puerta está cerrada.
  await db.json.remove(`${col}/${id}`);
  await db.json.remove(`${col}/${id2}`);
  ok('ramas borradas');

  try {
    await db.json.remove(col);
    ok('colección borrada (este proyecto permite el borrado de colecciones)');
  } catch (e) {
    if (e.statusCode === 403) ok('borrar la colección entera: 403, como debe ser');
    else throw e;
  }

  console.log('notificaciones');
  const avisos = [];
  const fallosAviso = [];
  // Su propio socket, contra /notifications: no reusa el de tiempo real.
  const pararAvisos = db.notifications.watch((e) => avisos.push(e), {
    onError: (e) => fallosAviso.push(e),
  });
  await new Promise((r) => setTimeout(r, 1500));      // deja abrir el socket

  try {
    await db.notifications.send({ to: user.userId, title: 'Smoke', body: 'hola' });
    await new Promise((r) => setTimeout(r, 2500));    // deja llegar el aviso

    ok(avisos.length ? `llegó por el socket: ${avisos[0].notification.title}`
                     : 'AVISO no llegó ninguna notificación por el socket');
    ok(`list -> ${(await db.notifications.list()).length}, sin leer -> ${await db.notifications.unreadCount()}`);
    await db.notifications.markAllRead();
    ok(`marcadas como leídas, sin leer -> ${await db.notifications.unreadCount()}`);
  } catch (e) {
    // Quién puede enviar se decide por proyecto: "solo desde el servidor" es
    // una configuración válida, no un fallo del paquete.
    if (e.statusCode === 403) ok(`envío no permitido a un usuario en este proyecto: ${e.message}`);
    else throw e;
  } finally {
    pararAvisos();
    if (fallosAviso.length) console.log(`  AVISO notificaciones: ${fallosAviso[0]?.message ?? fallosAviso[0]}`);
  }

  console.log('entrar sin cuenta');
  // Una clave con la forma buena pero inventada: lo que se prueba es que el
  // paquete corta aquí, sin salir a la red, así que no hace falta una de verdad.
  const buzon = new RobleApiClient({
    baseUrl: BASE, contractId: CONTRACT,
    anonKey: `roble_anon_0123456789abcdef_${'a'.repeat(43)}`,
  });
  try {
    await buzon.read('_smoke');
    throw new Error('la clave publicable pudo leer');
  } catch (e) {
    if (!(e instanceof RobleAnonKeyScopeException)) throw e;
    ok('clave publicable: leer se rechaza sin salir a la red');
  }

  // El invitado va en su propio cliente: iniciar sesión como invitado en `db`
  // sustituiría la cuenta desechable, y el `finally` borraría la equivocada.
  const memoriaInvitado = new Map();
  const invitado = new RobleApiClient({
    baseUrl: BASE, contractId: CONTRACT,
    storage: { getItem: (k) => memoriaInvitado.get(k) ?? null,
               setItem: (k, v) => memoriaInvitado.set(k, v),
               removeItem: (k) => memoriaInvitado.delete(k) },
  });
  try {
    await invitado.signInAnonymously();
    ok(`sesión de invitado -> isAnonymous=${invitado.isAnonymous}`);
    if (!invitado.isAnonymous) throw new Error('el token del invitado no dice isAnonymous');
    await invitado.deleteAccount();
    ok('invitado eliminado');
  } catch (e) {
    // Encenderla es decisión del proyecto: apagada es una configuración
    // válida, y el `code` dice cuál de las dos condiciones falta.
    if (e instanceof RobleAnonymousAuthException) {
      ok(`sesión de invitado no habilitada en este proyecto (${e.code})`);
    } else if (e.statusCode === 429) {
      // El servidor limita cuántas sesiones de invitado se piden seguidas. No
      // es un fallo del paquete ni del proyecto: es la protección haciendo su
      // trabajo, y correr el smoke dos veces seguidas basta para verla.
      ok('sesión de invitado: el servidor está limitando la frecuencia (429)');
    } else if ((e.statusCode === 403 || e.statusCode === 409) && /anónim|propiedad por fila/i.test(e.message)) {
      // El mismo rechazo, pero sin `code`: un auth-service que lo pierde en su
      // filtro de excepciones. La app no podrá distinguirlo por tipo.
      ok(`sesión de invitado no habilitada en este proyecto: ${e.message}`);
      console.log('  AVISO el servidor no manda `code`: RobleAnonymousAuthException no va a saltar. Actualiza auth-service.');
    } else {
      throw e;
    }
  } finally {
    invitado.realtime.close();
    invitado.notificationsConnection.close();
  }
} catch (e) {
  console.error('FALLÓ:', e.constructor?.name, e.statusCode ?? '', e.message);
  process.exitCode = 1;
} finally {
  if (creado) {
    try { await db.deleteAccount(); console.log('  ok   cuenta desechable eliminada'); }
    catch (e) { console.error('  AVISO no se pudo borrar la cuenta:', e.message); }
  }
  db.realtime.close();
  db.notificationsConnection.close();
}
