import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CorteVendedor } from './entities/corte-vendedor.entity';
import { CreateCorteVendedorInput } from './dto/create-corte-vendedor.input';
import { UpdateCorteVendedorInput } from './dto/update-corte-vendedor.input';
import { NotificationsService } from '../notifications/notifications.service';
import { PaginationArgs } from '../common/dto/pagination.args';
import { Usuario } from '../usuarios/usuario.entity';
import { SearchArgs } from '../common/dto/search.args';

@Injectable()
export class CortesVendedorService {
    constructor(
        @InjectRepository(CorteVendedor)
        private readonly corteRepository: Repository<CorteVendedor>,
        private readonly notificationsService: NotificationsService,
    ) {}

    async create(createCorteInput: CreateCorteVendedorInput): Promise<CorteVendedor> {
        const nuevo = this.corteRepository.create(createCorteInput);
        const guardado = await this.corteRepository.save(nuevo);

        // Notificar al vendedor
        const corteCompleto = await this.findOne(guardado.id_corte);
        if (corteCompleto.vendedor?.usuario?.push_token) {
            await this.notificationsService.sendPushNotification(
                corteCompleto.vendedor.usuario.push_token,
                '💰 Corte Procesado',
                `Tu corte #${corteCompleto.id_corte} ha sido registrado exitosamente.`,
                { id_corte: corteCompleto.id_corte }
            );
        }

        return corteCompleto;
    }

    // 👇 Búsqueda inteligente en el Backend con paginación y filtro de vendedor
    async findAll(searchArgs: SearchArgs, usuario: Usuario): Promise<CorteVendedor[]> {
        const { skip, take, search = '' } = searchArgs;
        const query = this.corteRepository.createQueryBuilder('corte')
        .leftJoinAndSelect('corte.vendedor', 'vendedor')
        .leftJoinAndSelect('corte.asignacion', 'asignacion')
        .leftJoinAndSelect('corte.detalles', 'detalles')
        .leftJoinAndSelect('detalles.producto', 'producto')
        .offset(skip)
        .limit(take)
        .orderBy('corte.id_corte', 'DESC');

        if (usuario.rol_id === 2) {
            query.andWhere('corte.vendedor_id = :vendedor_id', { vendedor_id: usuario.id_vendedor });
        }

        if (search.trim() !== '') {
            const isNumber = !isNaN(Number(search));
            if (isNumber) {
                query.andWhere('corte.id_corte = :id', { id: Number(search) }); // Busca por Folio
            } else {
                query.andWhere('vendedor.nombre_completo LIKE :search', { search: `%${search}%` }); // Busca por Vendedor
            }
        }

        return query.getMany();
    }

    // 👇 NUEVO: Búsqueda segura para el panel "Mis Finanzas" del Vendedor
    async findByVendedor(vendedor_id: number): Promise<CorteVendedor[]> {
        return this.corteRepository.find({
            where: { vendedor_id },
            relations: ['vendedor', 'asignacion', 'detalles', 'detalles.producto'],
            take: 30, // Solo sus últimos 30 cortes
            order: { id_corte: 'DESC' }
        });
    }

    async findOne(id_corte: number): Promise<CorteVendedor> {
        const corte = await this.corteRepository.findOne({
            where: { id_corte },
            relations: ['vendedor', 'vendedor.usuario', 'asignacion', 'detalles', 'detalles.producto'],
        });
        if (!corte) throw new NotFoundException(`Corte #${id_corte} no encontrado`);
        return corte;
    }

    async update(
        id_corte: number,
        updateCorteInput: UpdateCorteVendedorInput,
    ): Promise<CorteVendedor> {
        const corte = await this.findOne(id_corte);
        if (!corte) throw new NotFoundException(`Corte #${id_corte} no encontrado`);

        const {
            vendedor_id,
            asignacion_id,
            dinero_esperado,
            dinero_total_entregado,
            diferencia_corte,
            observaciones,
            detalles,
        } = updateCorteInput;

        if (vendedor_id !== undefined) corte.vendedor_id = vendedor_id;
        if (asignacion_id !== undefined) corte.asignacion_id = asignacion_id;
        if (dinero_esperado !== undefined) corte.dinero_esperado = dinero_esperado;
        if (dinero_total_entregado !== undefined)
            corte.dinero_total_entregado = dinero_total_entregado;
        if (diferencia_corte !== undefined) corte.diferencia_corte = diferencia_corte;
        if (observaciones !== undefined) corte.observaciones = observaciones;

        if (detalles !== undefined) {
            // gracias a cascade: true, TypeORM se encarga de crear/actualizar/borrar detalle
            corte.detalles = detalles as any;
        }

        await this.corteRepository.save(corte);
        return this.findOne(id_corte);
    }
    async remove(id_corte: number): Promise<boolean> {
        const resultado = await this.corteRepository.delete(id_corte);
        return (resultado.affected ?? 0) > 0;
    }


}
