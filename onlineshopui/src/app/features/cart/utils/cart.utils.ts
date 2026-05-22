import { ProductDto } from '../../../core/types/dtos/product.dto';
import { CreateOrderDto } from '../../../core/types/dtos/order.dto';
import { AddressDto } from '../../../core/types/dtos/location.dto';
import { CartItem } from '../types/cart-item.type';

export function buildProductsById(products: ProductDto[]): Map<string, ProductDto> {
    return new Map(products.map(product => [product.id, product]));
}

export function calculateCartSubtotal(
    items: CartItem[],
    productsById: Map<string, ProductDto>
): string {
    const total = items.reduce((sum, item) => {
        const product = productsById.get(item.productId);
        if (!product) return sum;
        return sum + product.price * item.quantity;
    }, 0);

    return total.toFixed(2);
}

export function calculateLineTotal(quantity: number, price: number): string {
    return (quantity * price).toFixed(2);
}

export function toCreateOrderDto(items: CartItem[], address: AddressDto): CreateOrderDto | null {
    if (items.length === 0) {
        return null;
    }

    return {
        items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity
        })),
        address
    };
}
