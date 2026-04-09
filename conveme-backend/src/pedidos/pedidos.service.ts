import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pedido } from './entities/pedido.entity';
import { CreatePedidoInput } from './dto/create-pedido.input';
import { UpdatePedidoInput } from './dto/update-pedido.input';
import { PaginationArgs } from '../common/dto/pagination.args';
import { Usuario } from '../usuarios/usuario.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PedidosService {
    constructor(
        @InjectRepository(Pedido)
        private readonly pedidoRepository: Repository<Pedido>,
        private readonly notificationsService: NotificationsService,
    ) {}

    async create(createPedidoInput: CreatePedidoInput): Promise<Pedido> {
        if (createPedidoInput.fecha_entrega_estimada && typeof createPedidoInput.fecha_entrega_estimada === 'string') {
            createPedidoInput.fecha_entrega_estimada = new Date(createPedidoInput.fecha_entrega_estimada) as any;
        }
        if (createPedidoInput.fecha_pedido && typeof createPedidoInput.fecha_pedido === 'string') {
            createPedidoInput.fecha_pedido = new Date(createPedidoInput.fecha_pedido) as any;
        }

        const nuevo = this.pedidoRepository.create(createPedidoInput);
        const guardado = await this.pedidoRepository.save(nuevo);
        const pedidoCompleto = await this.findOne(guardado.id_pedido);

        if (pedidoCompleto.vendedor?.usuario?.expo_push_token) {
            await this.notificationsService.sendPushNotification(
                pedidoCompleto.vendedor.usuario.expo_push_token,
                '📦 Nuevo Pedido Asignado',
                `Se te ha asignado el pedido #${pedidoCompleto.id_pedido} por $${pedidoCompleto.monto_total}`
            );
        }

        return pedidoCompleto;
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
            relations: ['cliente', 'detalles', 'detalles.producto', 'vendedor', 'vendedor.usuario'],
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

        if (resto.fecha_entrega_estimada && typeof resto.fecha_entrega_estimada === 'string') {
            resto.fecha_entrega_estimada = new Date(resto.fecha_entrega_estimada) as any;
        }
        if (resto.fecha_pedido && typeof resto.fecha_pedido === 'string') {
            resto.fecha_pedido = new Date(resto.fecha_pedido) as any;
        }

        Object.assign(pedidoExistente, resto);

        // Asegurarse de que las fechas sean objetos Date antes de guardar para evitar errores de MySQL
        if (pedidoExistente.fecha_entrega_estimada && typeof pedidoExistente.fecha_entrega_estimada === 'string') {
            pedidoExistente.fecha_entrega_estimada = new Date(pedidoExistente.fecha_entrega_estimada);
        }
        if (pedidoExistente.fecha_pedido && typeof pedidoExistente.fecha_pedido === 'string') {
            pedidoExistente.fecha_pedido = new Date(pedidoExistente.fecha_pedido);
        }

        await this.pedidoRepository.save(pedidoExistente);

        const pedidoActualizado = await this.findOne(id_pedido);

        if (pedidoActualizado.vendedor?.usuario?.expo_push_token) {
            await this.notificationsService.sendPushNotification(
                pedidoActualizado.vendedor.usuario.expo_push_token,
                '🔄 Pedido Actualizado',
                `El pedido #${pedidoActualizado.id_pedido} ha sido actualizado a ${pedidoActualizado.estado.toUpperCase()}`
            );
        }

        return pedidoActualizado;
    }

    async remove(id_pedido: number): Promise<boolean> {
        let pedidoToDelete;
        try {
            pedidoToDelete = await this.findOne(id_pedido);
        } catch (e) {
            // Ignorar si no existe
        }

        const resultado = await this.pedidoRepository.delete(id_pedido);
        const success = (resultado.affected ?? 0) > 0;

        if (success && pedidoToDelete?.vendedor?.usuario?.expo_push_token) {
            await this.notificationsService.sendPushNotification(
                pedidoToDelete.vendedor.usuario.expo_push_token,
                '❌ Pedido Eliminado',
                `El pedido #${id_pedido} asignado a ti ha sido eliminado del sistema.`
            );
        }

        return success;
    }
}
