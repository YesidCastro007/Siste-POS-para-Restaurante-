export const MENU_DATA = {
  picadas: {
    sizes: ['Personal', 'Para 2', 'Para 4', 'Familiar'],
    carnes: ['Res', 'Cerdo', 'Rellena', 'Chorizo','Gallina'],
    terminos: ['Jugoso', '3/4', 'Bien cocido']
  },
  gallina: {
    productos: [
      { name: '1/2 Gallina Asada', price: 40000 },
      { name: 'Gallina Entera', price: 80000 },
      { name: 'Pierna Pernil', price: 18000 },
      { name: 'Pechuga', price: 18000 },
      { name: 'Rabadilla', price: 18000 },
      { name: 'Ala', price: 10000 }
    ],
    terminos: ['Jugoso', '3/4', 'Bien cocido']
  },
  sopas: {
    price: 10000, // Precio fijo
    sabores: [] // Se cargará dinámicamente desde localStorage
  },
  bebidas: {
    'Jugos Hit y Gaseosas 350ml': [
      { name: 'Jugo Hit Mango', price: 3000 },
      { name: 'Jugo Hit Lulo', price: 3000 },
      { name: 'Jugo Hit Mora', price: 3000 },
      { name: 'Jugo Hit Tropical', price: 3000 },
      { name: 'Jugo Hit Naranja Piña', price: 3000 },
      { name: 'Botella de Agua', price: 3000 },
      { name: 'Colombiana 350ml', price: 3000 },
      { name: 'Pepsi 350ml', price: 3000 },
      { name: 'Manzana 350ml', price: 3000 }
    ],
    'Cervezas y Cola & Pola 350ml': [
      { name: 'Cerveza Aguila', price: 3500 },
      { name: 'Cerveza Poker', price: 3500 },
      { name: 'Cola & Pola 330ml', price: 3500 }
    ],
    'Gaseosas & Cola y Pola 1.5L': [
      { name: 'Cola y Pola 1.5L', price: 8000 },
      { name: 'Colombiana 1.5L', price: 6000 },
      { name: 'Manzana 1.5L', price: 6000 },
      { name: 'Pepsi 1.5L', price: 6000 }
    ],
  },
  adicionales: [
    { name: 'Porción de yuca', price: 4000, fixed: true },
    { name: 'Porción de papa', price: 4000, fixed: true },
    { name: 'Porción de plátano', price: 4000, fixed: true },
    { name: 'Guacamole', price: 3000, fixed: true },
    { name: 'Arepa', price: 2000, fixed: true }
  ]
};

export const PISOS = [
  { number: 1, mesas: 15 },
  { number: 2, mesas: 18 },
  { number: 3, mesas: 10 }
];

export const SABORES_POR_DEFECTO = ['Sopa de costilla', 'Sancocho'];
