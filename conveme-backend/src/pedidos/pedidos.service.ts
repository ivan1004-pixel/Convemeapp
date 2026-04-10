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

    async create(createPedidoInput: CreatePedidoInput, usuario: Usuario): Promise<Pedido> {
        // Normalizar fecha_entrega_estimada si viene como string ISO
        if (
            createPedidoInput.fecha_entrega_estimada &&
            typeof createPedidoInput.fecha_entrega_estimada === 'string'
        ) {
            createPedidoInput.fecha_entrega_estimada = new Date(
                createPedidoInput.fecha_entrega_estimada,
            ) as any;
        }

        // Si es vendedor y no mandó vendedor_id, lo seteamos nosotros
        if (usuario.rol_id === 2 && !createPedidoInput.vendedor_id) {
            createPedidoInput.vendedor_id = usuario.id_vendedor as number;
        }

        // Crear entidad a partir del input
        const nuevo = this.pedidoRepository.create(createPedidoInput as any);

        // TIPADO EXPLÍCITO para evitar Pedido[]
        const guardado = (await this.pedidoRepository.save(
            nuevo,
        )) as unknown as Pedido;

        const pedidoCompleto = await this.findOne(guardado.id_pedido);

        // Usar push_token del usuario para notificación
        if (pedidoCompleto.vendedor?.usuario?.push_token) {
            await this.notificationsService.sendPushNotification(
                pedidoCompleto.vendedor.usuario.push_token,
                '📦 Nuevo Pedido Asignado',
                `Se te ha asignado el pedido #${pedidoCompleto.id_pedido} por $${pedidoCompleto.monto_total}`,
            );
        }

        return pedidoCompleto;
    }

    async findAll(
        paginationArgs: PaginationArgs,
        usuario?: Usuario,
    ): Promise<Pedido[]> {
        const { skip, take } = paginationArgs;

        const query = this.pedidoRepository
        .createQueryBuilder('pedido')
        .leftJoinAndSelect('pedido.cliente', 'cliente')
        .leftJoinAndSelect('pedido.detalles', 'detalles')
        .leftJoinAndSelect('detalles.producto', 'producto')
        .leftJoinAndSelect('pedido.vendedor', 'vendedor')
        .leftJoinAndSelect('vendedor.usuario', 'usuario');

        // Filtro de seguridad por vendedor
        if (usuario && usuario.rol_id === 2 && usuario.id_vendedor) {
            query.where('pedido.vendedor_id = :vendedor_id', {
                vendedor_id: usuario.id_vendedor,
            });
        }

        const results = await query
        .orderBy('pedido.fecha_pedido', 'DESC')
        .offset(skip)
        .limit(take)
        .getMany();

        // Normalizar fechas si por alguna razón vienen como string
        return results.map((pedido) => {
            if (pedido.fecha_pedido && typeof pedido.fecha_pedido === 'string') {
                pedido.fecha_pedido = new Date(pedido.fecha_pedido);
            }
            if (
                pedido.fecha_entrega_estimada &&
                typeof pedido.fecha_entrega_estimada === 'string'
            ) {
                pedido.fecha_entrega_estimada = new Date(
                    pedido.fecha_entrega_estimada,
                );
            }
            return pedido;
        });
    }

    async findOne(id_pedido: number): Promise<Pedido> {
        const pedido = await this.pedidoRepository.findOne({
            where: { id_pedido },
            relations: [
                'cliente',
                'detalles',
                'detalles.producto',
                'vendedor',
                'vendedor.usuario',
            ],
        });

        if (!pedido) {
            throw new NotFoundException(`Pedido #${id_pedido} no encontrado`);
        }

        if (pedido.fecha_pedido && typeof pedido.fecha_pedido === 'string') {
            pedido.fecha_pedido = new Date(pedido.fecha_pedido);
        }
        if (
            pedido.fecha_entrega_estimada &&
            typeof pedido.fecha_entrega_estimada === 'string'
        ) {
            pedido.fecha_entrega_estimada = new Date(
                pedido.fecha_entrega_estimada,
            );
        }

        return pedido;
    }

    async update(
        id_pedido: number,
        updatePedidoInput: UpdatePedidoInput,
    ): Promise<Pedido> {
        const { detalles, ...resto } = updatePedidoInput;

        const pedidoExistente = await this.pedidoRepository.findOne({
            where: { id_pedido },
            relations: ['detalles', 'vendedor', 'vendedor.usuario'],
        });

        if (!pedidoExistente) {
            throw new NotFoundException(`Pedido #${id_pedido} no encontrado`);
        }

        // Manejo de detalles: eliminar los viejos y asignar los nuevos
        if (detalles) {
            await this.pedidoRepository.manager.delete('det_pedidos', {
                pedido_id: id_pedido,
            });
            (pedidoExistente as any).detalles = detalles;
        }

        // Normalizar fecha_entrega_estimada si viene como string en resto
        if (
            (resto as any).fecha_entrega_estimada &&
            typeof (resto as any).fecha_entrega_estimada === 'string'
        ) {
            (resto as any).fecha_entrega_estimada = new Date(
                (resto as any).fecha_entrega_estimada,
            ) as any;
        }

        Object.assign(pedidoExistente, resto);

        // Por seguridad, asegúrate que las fechas son Date antes de guardar
        if (
            pedidoExistente.fecha_entrega_estimada &&
            typeof pedidoExistente.fecha_entrega_estimada === 'string'
        ) {
            pedidoExistente.fecha_entrega_estimada = new Date(
                pedidoExistente.fecha_entrega_estimada,
            );
        }
        if (
            pedidoExistente.fecha_pedido &&
            typeof pedidoExistente.fecha_pedido === 'string'
        ) {
            pedidoExistente.fecha_pedido = new Date(pedidoExistente.fecha_pedido);
        }

        await this.pedidoRepository.save(pedidoExistente);

        const pedidoActualizado = await this.findOne(id_pedido);

        if (pedidoActualizado.vendedor?.usuario?.push_token) {
            await this.notificationsService.sendPushNotification(
                pedidoActualizado.vendedor.usuario.push_token,
                '🔄 Pedido Actualizado',
                `El pedido #${pedidoActualizado.id_pedido} ha sido actualizado a ${(
                    pedidoActualizado.estado ?? ''
                ).toUpperCase()}`,
            );
        }

        return pedidoActualizado;
    }

    async remove(id_pedido: number): Promise<boolean> {
        let pedidoToDelete: Pedido | undefined;
        try {
            pedidoToDelete = await this.findOne(id_pedido);
        } catch {
            // Ignorar si no existe
        }

        const resultado = await this.pedidoRepository.delete(id_pedido);
        const success = (resultado.affected ?? 0) > 0;

        if (success && pedidoToDelete?.vendedor?.usuario?.push_token) {
            await this.notificationsService.sendPushNotification(
                pedidoToDelete.vendedor.usuario.push_token,
                '❌ Pedido Eliminado',
                `El pedido #${id_pedido} asignado a ti ha sido eliminado del sistema.`,
            );
        }

        return success;
    }
}
