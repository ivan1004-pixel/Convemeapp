import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { PedidosService } from './pedidos.service';
import { Pedido } from './entities/pedido.entity';
import { CreatePedidoInput } from './dto/create-pedido.input';
import { UpdatePedidoInput } from './dto/update-pedido.input';
import { PaginationArgs } from '../common/dto/pagination.args';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUsuario } from '../auth/get-usuario.decorator';
import { Usuario } from '../usuarios/usuario.entity';

@Resolver(() => Pedido)
export class PedidosResolver {
    constructor(private readonly pedidosService: PedidosService) {}

    @UseGuards(JwtAuthGuard)
    @Mutation(() => Pedido)
    createPedido(
        @Args('createPedidoInput') createPedidoInput: CreatePedidoInput,
        @GetUsuario() usuario: Usuario,
    ) {
        return this.pedidosService.create(createPedidoInput, usuario);
    }

    @UseGuards(JwtAuthGuard)
    @Query(() => [Pedido], { name: 'pedidos' })
    findAll(
        @Args() paginationArgs: PaginationArgs,
        @GetUsuario() usuario: Usuario,
    ) {
        return this.pedidosService.findAll(paginationArgs, usuario);
    }

    @Query(() => Pedido, { name: 'pedido' })
    findOne(@Args('id_pedido', { type: () => Int }) id_pedido: number) {
        return this.pedidosService.findOne(id_pedido);
    }

    @Mutation(() => Pedido)
    updatePedido(@Args('updatePedidoInput') updatePedidoInput: UpdatePedidoInput) {
        return this.pedidosService.update(updatePedidoInput.id_pedido, updatePedidoInput);
    }

    @Mutation(() => Boolean)
    removePedido(@Args('id_pedido', { type: () => Int }) id_pedido: number) {
        return this.pedidosService.remove(id_pedido);
    }
}
