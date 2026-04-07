export type Product = {
    id: number;
    name: string;
    price: number;
    stock: number;
}

export type CartItem = {
    productId: number;
    quantity: number;
    
}