import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { CortesVendedorService } from './cortes-vendedor.service';
import { CorteVendedor } from './entities/corte-vendedor.entity';
import { CreateCorteVendedorInput } from './dto/create-corte-vendedor.input';
import { UpdateCorteVendedorInput } from './dto/update-corte-vendedor.input';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaginationArgs } from '../common/dto/pagination.args';
import { GetUsuario } from '../auth/get-usuario.decorator';
import { Usuario } from '../usuarios/usuario.entity';

import { SearchArgs } from '../common/dto/search.args';

@Resolver(() => CorteVendedor)
export class CortesVendedorResolver {
    constructor(private readonly cortesVendedorService: CortesVendedorService) {}

    @Mutation(() => CorteVendedor)
    createCorteVendedor(@Args('createCorteVendedorInput') createCorteVendedorInput: CreateCorteVendedorInput) {
        return this.cortesVendedorService.create(createCorteVendedorInput);
    }

    // 👇 Actualizado para recibir variables de paginación y búsqueda unificadas
    @UseGuards(JwtAuthGuard)
    @Query(() => [CorteVendedor], { name: 'cortesVendedor' })
    findAll(
        @Args() searchArgs: SearchArgs,
        @GetUsuario() usuario: Usuario,
    ) {
        return this.cortesVendedorService.findAll(searchArgs, usuario);
    }

    // 👇 NUEVO: El endpoint para "Mis Finanzas"
    @Query(() => [CorteVendedor], { name: 'cortesPorVendedor' })
    findByVendedor(@Args('vendedor_id', { type: () => Int }) vendedor_id: number) {
        return this.cortesVendedorService.findByVendedor(vendedor_id);
    }

    @Query(() => CorteVendedor, { name: 'corteVendedor' })
    findOne(@Args('id_corte', { type: () => Int }) id_corte: number) {
        return this.cortesVendedorService.findOne(id_corte);
    }

    @Mutation(() => CorteVendedor)
    updateCorteVendedor(@Args('updateCorteVendedorInput') updateCorteVendedorInput: UpdateCorteVendedorInput) {
        return this.cortesVendedorService.update(updateCorteVendedorInput.id_corte, updateCorteVendedorInput);
    }

    @Mutation(() => Boolean)
    removeCorteVendedor(@Args('id_corte', { type: () => Int }) id_corte: number) {
        return this.cortesVendedorService.remove(id_corte);
    }
}
