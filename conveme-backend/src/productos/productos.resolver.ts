import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { ProductosService } from './productos.service';
import { Producto } from './producto.entity';
import { CreateProductoInput } from './dto/create-producto.input';
import { UpdateProductoInput } from './dto/update-producto.input';
import { PaginationArgs } from '../common/dto/pagination.args';

@Resolver(() => Producto)
export class ProductosResolver {
    constructor(private readonly productosService: ProductosService) {}

    @Mutation(() => Producto)
    createProducto(@Args('createProductoInput') createProductoInput: CreateProductoInput) {
        return this.productosService.create(createProductoInput);
    }

    @Query(() => [Producto], { name: 'productos' })
    findAll(@Args() paginationArgs: PaginationArgs) {
        return this.productosService.findAll(paginationArgs);
    }

    @Query(() => Producto, { name: 'producto' })
    findOne(@Args('id_producto', { type: () => Int }) id_producto: number) {
        return this.productosService.findOne(id_producto);
    }

    @Mutation(() => Producto)
    updateProducto(@Args('updateProductoInput') updateUsuarioInput: UpdateProductoInput) {
        return this.productosService.update(updateUsuarioInput.id_producto, updateUsuarioInput);
    }

    @Mutation(() => Producto)
    removeProducto(@Args('id_producto', { type: () => Int }) id_producto: number) {
        return this.productosService.remove(id_producto);
    }

    @Query(() => [Producto], { name: 'buscarProductos' })
    searchProductos(
        @Args('termino', { type: () => String, nullable: true }) termino?: string,
        @Args() paginationArgs?: PaginationArgs,
    ) {
        return this.productosService.searchProductos(termino || '', paginationArgs);
    }
}
