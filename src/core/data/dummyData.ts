import { Row } from "../roble/guard";

// El backend falso: las mismas filas que devolvería Roble, en memoria.
//
// Guarda **filas**, no entidades, y esa es la gracia: los datasources en
// memoria devuelven lo mismo que los de Roble, así que el repositorio —que es
// uno solo— hace el mismo trabajo en los dos casos.
//
// Se pierde al cerrar la app. Existe para trabajar en la UI sin servidor y
// para que las pruebas no necesiten red. (Es el `DummyData` de f_market.)
export class DummyData {
  // La cuenta con la que arranca la demo.
  static readonly demoEmail = "ana@demo.com";
  static readonly demoPassword = "123456";

  // Filas de `user_system`, con lo poco que la app mira de ellas.
  users: Row[] = [];
  passwords: Record<string, string> = {};

  listings: Row[] = [];
  questions: Row[] = [];
  follows: Row[] = [];
  threads: Row[] = [];
  brands: Row[] = [];
  models: Row[] = [];
  ratings: Row[] = [];
  // El árbol JSON: `threadId -> {clave: mensaje}`, claves ordenadas por tiempo.
  messages: Record<string, Row> = {};
  // La bandeja de avisos de cada usuario (en Roble, `db.notifications`).
  notifications: Row[] = [];

  // Quién tiene la sesión abierta, o `null`.
  session: Row | null = null;

  // Latencia simulada, para que los estados de carga se vean. Las pruebas la
  // bajan: en Jest los relojes son de verdad.
  readonly latencyMs: number;

  // Arranca por encima de los ids sembrados a mano: si volviera a emitirlos,
  // una fila nueva pisaría una de prueba.
  private counter = 100;
  nextId(prefix: string) {
    this.counter += 1;
    return `${prefix}_${this.counter}`;
  }

  constructor({ latencyMs = 300 }: { latencyMs?: number } = {}) {
    this.latencyMs = latencyMs;
    this.seed();
  }

  // Espera la latencia simulada, escalada para cada tipo de llamada.
  delay(factor = 1) {
    return new Promise<void>((resolve) => setTimeout(resolve, this.latencyMs * factor));
  }

  private ago(ms: number) {
    return new Date(Date.now() - ms).toISOString();
  }

  private seed() {
    const hour = 3600_000;
    const day = 24 * hour;

    this.users.push(
      { userId: "u_ana", name: "Ana Torres", email: DummyData.demoEmail },
      { userId: "u_beto", name: "Beto Ramirez", email: "beto@demo.com" },
      { userId: "u_carla", name: "Carla Mendez", email: "carla@demo.com" },
    );
    for (const u of this.users) this.passwords[u.email] = DummyData.demoPassword;

    this.listings.push(
      {
        _id: "l_1",
        seller_id: "u_beto",
        seller_name: "Beto Ramirez",
        brand: "Mazda",
        model: "3 Grand Touring",
        year: 2021,
        price: 78500000,
        mileage_km: 42000,
        fuel: "gasoline",
        transmission: "automatic",
        city: "Barranquilla",
        description:
          "Unico dueno, mantenimientos en concesionario, llantas nuevas. Sin choques ni reparaciones de latoneria.",
        image_1: "assets/cars/mazda3_0.png",
        image_2: "assets/cars/mazda3_1.png",
        image_3: "assets/cars/mazda3_2.png",
        status: "available",
        created_at: this.ago(2 * day),
      },
      {
        _id: "l_2",
        seller_id: "u_carla",
        seller_name: "Carla Mendez",
        brand: "Renault",
        model: "Duster Intens",
        year: 2019,
        price: 56900000,
        mileage_km: 88500,
        fuel: "gasoline",
        transmission: "manual",
        city: "Bogota",
        description: "Camioneta familiar, ideal para carretera. Soat y tecnomecanica al dia hasta diciembre.",
        image_1: "assets/cars/duster_0.png",
        image_2: "assets/cars/duster_1.png",
        status: "reserved",
        created_at: this.ago(6 * day),
      },
      {
        _id: "l_3",
        seller_id: "u_beto",
        seller_name: "Beto Ramirez",
        brand: "Chevrolet",
        model: "Onix Turbo",
        year: 2023,
        price: 64200000,
        mileage_km: 15300,
        fuel: "gasoline",
        transmission: "automatic",
        city: "Medellin",
        description: "Practicamente nuevo, aun con garantia de fabrica.",
        image_1: "assets/cars/onix_0.png",
        status: "available",
        created_at: this.ago(1 * day),
      },
      {
        _id: "l_4",
        seller_id: "u_ana",
        seller_name: "Ana Torres",
        brand: "Toyota",
        model: "Corolla Cross Hybrid",
        year: 2022,
        price: 132000000,
        mileage_km: 31000,
        fuel: "hybrid",
        transmission: "automatic",
        city: "Barranquilla",
        description: "Hibrida, consumo real de 20 km/galon en ciudad. Recibo carro de menor valor.",
        image_1: "assets/cars/corolla_0.png",
        image_2: "assets/cars/corolla_1.png",
        status: "available",
        created_at: this.ago(9 * day),
      },
      {
        _id: "l_5",
        seller_id: "u_carla",
        seller_name: "Carla Mendez",
        brand: "Kia",
        model: "Picanto",
        year: 2018,
        price: 38000000,
        mileage_km: 96000,
        fuel: "gasoline",
        transmission: "manual",
        city: "Cali",
        description: "Economico y facil de parquear. Motor y caja perfectos.",
        image_1: "assets/cars/picanto_0.png",
        image_2: "assets/cars/picanto_1.png",
        status: "sold",
        buyer_id: "u_ana",
        buyer_name: "Ana Torres",
        sold_at: this.ago(12 * day),
        created_at: this.ago(20 * day),
      },
      {
        // Sin fotos a propósito: deja ver el relleno de color de `CarPhoto`.
        _id: "l_6",
        seller_id: "u_beto",
        seller_name: "Beto Ramirez",
        brand: "Nissan",
        model: "Versa Sense",
        year: 2020,
        price: 52400000,
        mileage_km: 61000,
        fuel: "gasoline",
        transmission: "automatic",
        city: "Cartagena",
        description: "Publicacion sin fotos: sirve para ver como se ve una tarjeta cuando el vendedor aun no ha subido ninguna.",
        status: "available",
        created_at: this.ago(4 * day),
      },
    );

    this.seedVehicles();

    this.ratings.push(
      {
        _id: "r_1",
        listing_id: "l_5",
        rater_id: "u_ana",
        rater_name: "Ana Torres",
        rated_id: "u_carla",
        rated_role: "seller",
        stars: 5,
        comment: "Todo tal como lo describio, y me ayudo con el traspaso.",
        created_at: this.ago(11 * day),
      },
      {
        _id: "r_2",
        listing_id: "l_5",
        rater_id: "u_carla",
        rater_name: "Carla Mendez",
        rated_id: "u_ana",
        rated_role: "buyer",
        stars: 4,
        comment: "Compradora seria, aunque llego tarde a la cita.",
        created_at: this.ago(11 * day),
      },
    );

    this.questions.push(
      {
        _id: "q_1",
        listing_id: "l_1",
        asker_id: "u_ana",
        asker_name: "Ana Torres",
        body: "Hola, se puede ver en Barranquilla el fin de semana?",
        created_at: this.ago(30 * hour),
        answer_body: "Claro, el sabado en la manana. Te escribo por chat privado.",
        answer_by: "u_beto",
        answer_by_name: "Beto Ramirez",
        answered_at: this.ago(27 * hour),
      },
      {
        _id: "q_2",
        listing_id: "l_1",
        asker_id: "u_carla",
        asker_name: "Carla Mendez",
        body: "Acepta parte de pago con una moto?",
        created_at: this.ago(5 * hour),
      },
      {
        _id: "q_3",
        listing_id: "l_2",
        asker_id: "u_ana",
        asker_name: "Ana Torres",
        body: "Cuantos duenos ha tenido?",
        created_at: this.ago(1 * day),
      },
    );

    this.follows.push(
      { _id: "f_1", listing_id: "l_1", user_id: "u_ana", created_at: this.ago(2 * day) },
      { _id: "f_2", listing_id: "l_2", user_id: "u_ana", created_at: this.ago(1 * day) },
    );

    this.threads.push({
      _id: "t_1",
      listing_id: "l_1",
      listing_title: "Mazda 3 Grand Touring 2021",
      listing_cover: "assets/cars/mazda3_0.png",
      buyer_id: "u_ana",
      buyer_name: "Ana Torres",
      seller_id: "u_beto",
      seller_name: "Beto Ramirez",
      created_at: this.ago(5 * hour),
      last_message: "Perfecto, nos vemos el sabado a las 9.",
      last_message_at: this.ago(3 * hour),
      buyer_muted: false,
      seller_muted: false,
      buyer_unread: 1,
      seller_unread: 0,
    });

    this.messages.t_1 = {
      m_001: { sender_id: "u_ana", sender_name: "Ana Torres", text: "Buenas, sigue disponible?", sent_at: this.ago(5 * hour) },
      m_002: { sender_id: "u_beto", sender_name: "Beto Ramirez", text: "Si, disponible. Cuando quieres verlo?", sent_at: this.ago(4 * hour) },
      m_003: { sender_id: "u_beto", sender_name: "Beto Ramirez", text: "Perfecto, nos vemos el sabado a las 9.", sent_at: this.ago(3 * hour) },
    };
  }

  // Un recorte del catálogo que hay en Roble: basta para que la tira de marcas
  // se pueda arrastrar y para que cada marca tenga modelos.
  private seedVehicles() {
    const catalog: Record<string, string[]> = {
      Chevrolet: ["Spark GT", "Onix", "Onix Turbo", "Sail", "Tracker"],
      Renault: ["Sandero", "Logan", "Stepway", "Duster Intens", "Kwid"],
      Mazda: ["Mazda 2", "3 Grand Touring", "CX-3", "CX-30", "CX-5"],
      Toyota: ["Corolla", "Corolla Cross Hybrid", "Yaris", "RAV4", "Hilux"],
      Kia: ["Picanto", "Rio", "Sportage", "Seltos", "Soluto"],
      Nissan: ["March", "Versa Sense", "Kicks", "Qashqai", "Frontier"],
      Hyundai: ["Grand i10", "Accent", "Tucson", "Creta", "Venue"],
      Ford: ["Fiesta", "Focus", "EcoSport", "Escape", "Ranger"],
      Volkswagen: ["Gol", "Polo", "Virtus", "T-Cross", "Amarok"],
      Suzuki: ["Swift", "Baleno", "Vitara", "S-Cross", "Jimny"],
    };
    Object.entries(catalog).forEach(([name, models], order) => {
      const brandId = `b_${order + 1}`;
      this.brands.push({ _id: brandId, name, sort_order: order, active: true });
      models.forEach((model, i) =>
        this.models.push({ _id: `cm_${order + 1}_${i + 1}`, brand_id: brandId, name: model, sort_order: i, active: true }),
      );
    });
  }
}

// Filtra filas por igualdad, como `db.read(tabla, filtros)`.
export function matchesRow(row: Row, filters?: Row) {
  return !filters || Object.entries(filters).every(([k, v]) => row[k] === v);
}
