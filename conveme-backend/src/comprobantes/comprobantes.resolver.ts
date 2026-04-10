import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { ComprobantesService } from './comprobantes.service';
import { Comprobante } from './comprobante.entity';
import { CreateComprobanteInput } from './create-comprobante.input';
import { UpdateComprobanteInput } from './update-comprobante.input';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUsuario } from '../auth/get-usuario.decorator';
import { Usuario } from '../usuarios/usuario.entity';

@Resolver(() => Comprobante)
export class ComprobantesResolver {
    constructor(private readonly comprobantesService: ComprobantesService) {}

    @UseGuards(JwtAuthGuard)
    @Mutation(() => Comprobante)
    createComprobante(
        @Args('createComprobanteInput') createComprobanteInput: CreateComprobanteInput,
        @GetUsuario() usuario: Usuario,
    ) {
        return this.comprobantesService.create(createComprobanteInput, usuario);
    }

    @UseGuards(JwtAuthGuard)
    @Query(() => [Comprobante], { name: 'comprobantes' })
    findAll(@GetUsuario() usuario: Usuario) {
        return this.comprobantesService.findAll(usuario);
    }

    @UseGuards(JwtAuthGuard)
    @Query(() => [Comprobante], { name: 'comprobantesPorVendedor' })
    findByVendedor(@Args('vendedor_id', { type: () => Int }) vendedor_id: number) {
        return this.comprobantesService.findByVendedor(vendedor_id);
    }

    @UseGuards(JwtAuthGuard)
    @Query(() => Comprobante, { name: 'comprobante' })
    findOne(@Args('id', { type: () => Int }) id: number) {
        return this.comprobantesService.findOne(id);
    }

    @UseGuards(JwtAuthGuard)
    @Mutation(() => Comprobante)
    updateComprobante(@Args('updateComprobanteInput') updateInput: UpdateComprobanteInput) {
        return this.comprobantesService.update(updateInput.id_comprobante, updateInput);
    }

    @UseGuards(JwtAuthGuard)
    @Mutation(() => Boolean)
    removeComprobante(@Args('id', { type: () => Int }) id: number) {
        return this.comprobantesService.remove(id);
    }
}
