import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import { PaperProvider } from "react-native-paper";

import { Formatters } from "@/src/core/utils/formatters";
import { CarListing } from "@/src/features/listings/domain/entities/CarListing";
import { ListingCard } from "@/src/features/listings/presentation/widgets/ListingCard";

// Un componente sin estado: recibe datos y funciones, y pinta. No hace falta
// nada falso, ni contextos, ni repositorios.
const mazda: CarListing = {
  id: "l_1",
  sellerId: "u_ana",
  sellerName: "Ana Torres",
  brand: "Mazda",
  model: "3",
  year: 2021,
  price: 78500000,
  mileageKm: 42000,
  fuel: "gasoline",
  transmission: "automatic",
  city: "Barranquilla",
  description: "",
  // Sin fotos: la tarjeta pinta un color, sin ir a la red.
  images: [],
  status: "available",
  createdAt: new Date(2026, 8, 1),
  buyerId: null,
  buyerName: null,
  soldAt: null,
};

// Todo componente de Paper necesita su provider alrededor: de ahí sale el tema
// (el `MaterialApp` de Flutter).
const wrapInApp = (element: React.ReactElement) => render(<PaperProvider>{element}</PaperProvider>);

describe("ListingCard", () => {
  it("pinta el título, el precio y el estado", () => {
    wrapInApp(<ListingCard listing={mazda} onPress={() => {}} />);

    expect(screen.getByText("Mazda 3 2021")).toBeTruthy();
    expect(screen.getByText(Formatters.price(78500000))).toBeTruthy();
    expect(screen.getByText("Disponible")).toBeTruthy();
  });

  it("sin onToggleFollow no hay estrella", () => {
    wrapInApp(<ListingCard listing={mazda} onPress={() => {}} />);

    expect(screen.queryByTestId(ListingCard.followButtonKey)).toBeNull();
  });

  it("la estrella dice si ya se sigue", () => {
    wrapInApp(<ListingCard listing={mazda} onPress={() => {}} isFollowed onToggleFollow={() => {}} />);

    // En Flutter se buscaba el icono y el tooltip; aquí, la etiqueta de
    // accesibilidad, que es lo que lee un lector de pantalla.
    expect(screen.getByLabelText("Dejar de seguir")).toBeTruthy();
  });

  it("tocar la estrella avisa a quien la puso", () => {
    let taps = 0;
    wrapInApp(<ListingCard listing={mazda} onPress={() => {}} onToggleFollow={() => taps++} />);

    fireEvent.press(screen.getByTestId(ListingCard.followButtonKey));

    expect(taps).toBe(1);
  });

  it("tocar la tarjeta abre la publicación", () => {
    let opened = false;
    wrapInApp(<ListingCard testID="card" listing={mazda} onPress={() => (opened = true)} />);

    fireEvent.press(screen.getByTestId("card"));

    expect(opened).toBe(true);
  });
});
