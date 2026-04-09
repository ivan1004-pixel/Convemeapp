import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pedido } from './entities/pedido.entity';
import { CreatePedidoInput } from './dto/create-pedido.input';
import { UpdatePedidoInput } from './dto/update-pedido.input';
import { PaginationArgs } from '../common/dto/pagination.args';
import { Usuario } from '../usuarios/usuario.entity';

@Injectable()
export class PedidosService {
    constructor(
        @InjectRepository(Pedido)
        private readonly pedidoRepository: Repository<Pedido>,
    ) {}

    async create(createPedidoInput: CreatePedidoInput): Promise<Pedido> {
        const nuevo = this.pedidoRepository.create(createPedidoInput);
        const guardado = await this.pedidoRepository.save(nuevo);
        return this.findOne(guardado.id_pedido);
    }

    async findAll(paginationArgs: PaginationArgs, usuario?: Usuario): Promise<Pedido[]> {
        const { skip, take } = paginationArgs;
        
        const query = this.pedidoRepository.createQueryBuilder('pedido')
            .leftJoinAndSelect('pedido.cliente', 'cliente')
            .leftJoinAndSelect('pedido.detalles', 'detalles')
            .leftJoinAndSelect('detalles.producto', 'producto')
            .leftJoinAndSelect('pedido.vendedor', 'vendedor');

        // Filtro de seguridad por vendedor
        if (usuario && usuario.rol_id === 2 && usuario.id_vendedor) {
            query.where('pedido.vendedor_id = :vendedor_id', { vendedor_id: usuario.id_vendedor });
        }

        const results = await query
            .orderBy('pedido.fecha_pedido', 'DESC')
            .offset(skip)
            .limit(take)
            .getMany();
        
        // Transformar fechas que vengan como string a objetos Date para que el scalar DateTime no falle
        return results.map(pedido => {
            if (pedido.fecha_pedido && typeof pedido.fecha_pedido === 'string') {
                pedido.fecha_pedido = new Date(pedido.fecha_pedido);
            }
            if (pedido.fecha_entrega_estimada && typeof pedido.fecha_entrega_estimada === 'string') {
                pedido.fecha_entrega_estimada = new Date(pedido.fecha_entrega_estimada);
            }
            return pedido;
        });
    }

    async findOne(id_pedido: number): Promise<Pedido> {
        const pedido = await this.pedidoRepository.findOne({
            where: { id_pedido },
            relations: ['cliente', 'detalles', 'detalles.producto', 'vendedor'],
        });
        if (!pedido) throw new NotFoundException(`Pedido #${id_pedido} no encontrado`);
        
        if (pedido.fecha_pedido && typeof pedido.fecha_pedido === 'string') {
            pedido.fecha_pedido = new Date(pedido.fecha_pedido);
        }
        if (pedido.fecha_entrega_estimada && typeof pedido.fecha_entrega_estimada === 'string') {
            pedido.fecha_entrega_estimada = new Date(pedido.fecha_entrega_estimada);
        }

        return pedido;
    }

    async update(id_pedido: number, updatePedidoInput: UpdatePedidoInput): Promise<Pedido> {
        const { detalles, ...resto } = updatePedidoInput;

        const pedidoExistente = await this.pedidoRepository.findOne({
            where: { id_pedido },
            relations: ['detalles']
        });
        if (!pedidoExistente) throw new NotFoundException(`Pedido #${id_pedido} no encontrado`);

        if (detalles) {
            // Eliminar detalles viejos para evitar el error de FK a NULL
            await this.pedidoRepository.manager.delete('det_pedidos', { pedido_id: id_pedido });
            pedidoExistente.detalles = detalles as any;
        }

        Object.assign(pedidoExistente, resto);

        await this.pedidoRepository.save(pedidoExistente);

        return this.findOne(id_pedido);
    }

    async remove(id_pedido: number): Promise<boolean> {
        const resultado = await this.pedidoRepository.delete(id_pedido);
        return (resultado.affected ?? 0) > 0;
    }
}
