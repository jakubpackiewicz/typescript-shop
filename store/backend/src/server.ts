import express from 'express';
import { Product, CartItem } from './types.js';
import path from 'path';
import fs from 'fs';



const app = express();
const PORT = 3000;
const productsPath = "./src/data/products.json";
const cartPath = "./src/data/cart.json";



const readProducts = () : Product[] => {
    const data = fs.readFileSync(path.join(productsPath), 'utf-8');
    return JSON.parse(data);
}

const readCart = () : CartItem[] => {
    const data = fs.readFileSync(path.join(cartPath), 'utf-8');
    return JSON.parse(data);
}

const writeProducts = (product: Product[]) : void => {
    fs.writeFileSync(path.join(productsPath), JSON.stringify(product, null, 2));
}

const writeCart = (cart: CartItem[]) : void => {
    fs.writeFileSync(path.join(cartPath), JSON.stringify(cart, null, 2 ));
}

const fetchProductById = (id: number) : Product | undefined => {
    return readProducts().find(product => product.id === id);
    
}

const createNewId = () => {
    const products = readProducts();
    return products.length > 0 ? Math.max(...products.map(product => product.id)) + 1 : 1;
}




app.use(express.json());

app.post("/products", (request, response) => {
    const { name, price, stock } = request.body;

    //Check for missing parameters
    if (!name) {response.status(400).json({ message: "Name is required"}); return;}
    if (!price) {response.status(400).json({ message: "Price is required"}); return;}
    if (!stock) {response.status(400).json({ message: "Stock is required"}); return;}

    //Check for correct types

    if (typeof price !== 'number') { response.status(400).json({ message: "Price must be a number" }); return; }
    if (typeof stock !== 'number') { response.status(400).json({ message: "Stock must be a number" }); return; }
    if (typeof name !== 'string') { response.status(400).json({ message: "Name must be a string" }); return; }

    //Check if product is in the database

    const products = readProducts();
    const productInDatabase= products.find( product => product.name === name && product.price === price);

    //If product is in database add to its stock
    if (productInDatabase){
        productInDatabase.stock += stock;
        writeProducts(products);
        console.log(`[POST] Found product id ${productInDatabase.id}. Added to its stock ${stock}`);
        response.status(201).json({message: "Found product in database. Added to its stock."});
        return;
    }

    //Else add new product
    const product: Product = {
        "id" : createNewId(),
        "name" : name,
        "price" : price,
        "stock" : stock
    }

    products.push(product);
    writeProducts(products);
    console.log(`[POST] Added new product id ${product.id}`);
    response.sendStatus(201);
    return;

    
})

app.post("/cart", (request, response) => {
    const { productId, quantity=1 } = request.body;

    //Check for missing parameters
    if(!productId){
        response.status(400).json({ message: "Product Id is required"});
        return;
    }

    //Check for correct types
    if (typeof productId !== 'number') { response.status(400).json({ message: "ProductId must be a number" }); return; }
    if (typeof quantity !== 'number') { response.status(400).json({ message: "Quantity must be a number" }); return; }

    //Check if quantity isn't a negative number
    if(quantity < 0){
        response.status(400).json({ message: "Quantity must be higher than 0"});
        return;
    }
    
    const products = readProducts();
    const product = products.find(item => item.id === productId);

    //If product is in database
    if (product){
        
        if (product.stock >= quantity){
            const cart = readCart();

            //If product already in cart add to its quantity
            const cartEntry = cart.find( item => item.productId === product.id && item.price === product.price);
            if (cartEntry){
                cartEntry.quantity += quantity;
                writeCart(cart);
                console.log(`[POST] Found product in cart id ${product.id}. Added to its quantity by ${quantity}`);
                
                //Substract from products stock the quantity amount
            
                product.stock -= quantity;
                writeProducts(products);

                console.log(`[POST] Substracted products stock by ${quantity}`);

                response.sendStatus(201);
                return;
            }
            //Else add product to cart

            const cartItem: CartItem = {
                productId: product.id,
                name: product.name,
                quantity: quantity,
                price: product.price
            }
            cart.push(cartItem);
            writeCart(cart);
            console.log(`[POST] Added ProductId= ${productId} Quantity= ${quantity} to cart`);

            //Substract from products stock the quantity amount
            
            product.stock -= quantity;
            writeProducts(products);

            console.log(`[POST] Substracted products stock by ${quantity}`);

            response.sendStatus(201);
            return;
        } else {
            response.status(400).json({message: "Quantity amount is higher than stock amount"})
            return;
        }

        
    }
    //Else 404
    response.sendStatus(404);


    


})

app.get("/products/:id", (request, response) => {
    let fetchedProduct = fetchProductById(parseInt(request.params.id));
    if (fetchedProduct){
        response.send(fetchedProduct);
    } else { 
        response.sendStatus(404);
    }
    
})

app.get("/products/", (request, response) => {
    response.send(readProducts());
})

app.get("/cart", (request, response) => {
    response.send(readCart());
})

app.get("/", (request, response) => {
    response.send({ message: "Hello World!"});
})

app.listen(PORT, () => {
    console.log(`Sever started on port ${PORT}`);
})
