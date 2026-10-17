// Un usuario de la aplicación.
//
// `userId` es el del usuario en Roble (el que referencian las tablas), no el
// `id` de la fila del perfil. El `email` de un invitado es una dirección
// inventada `anon_…@anonymous.invalid`: no se muestra en pantalla.
export type AppUser = {
  userId: string;
  name: string;
  email: string;
  isAnonymous: boolean;
};
