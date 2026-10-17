// Una marca del catálogo precargado. Es cerrado a propósito: si cada quien
// escribe la marca a mano, «Chevrolet» y «chevrolet» son dos marcas distintas.
export type CarBrand = { id: string; name: string; sortOrder: number };

// Un modelo del catálogo, colgado de su marca.
export type CarModel = { id: string; brandId: string; name: string; sortOrder: number };
