import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AsignacionVendedor } from './entities/asignacion-vendedor.entity';
import { CreateAsignacionVendedorInput } from './dto/create-asignacion-vendedor.input';
import { UpdateAsignacionVendedorInput } from './dto/update-asignacion-vendedor.input';
import { NotificationsService } from '../notifications/notifications.service';
import { SearchArgs } from '../common/dto/search.args';

@Injectable()
export class AsignacionesVendedorService {
    constructor(
        @InjectRepository(AsignacionVendedor)
        private readonly asignacionRepository: Repository<AsignacionVendedor>,
        private readonly notificationsService: NotificationsService,
    ) {}

    async create(createAsignacionInput: CreateAsignacionVendedorInput): Promise<AsignacionVendedor> {
        const nueva = this.asignacionRepository.create(createAsignacionInput);
        const guardada = await this.asignacionRepository.save(nueva);
        
        // Notificar al vendedor
        const asignacionCompleta = await this.findOne(guardada.id_asignacion);
        if (asignacionCompleta.vendedor?.usuario?.push_token) {
            await this.notificationsService.sendPushNotification(
                asignacionCompleta.vendedor.usuario.push_token,
                '📦 Nueva Asignación',
                `Se te ha asignado una nueva ruta/producto (Folio: ${asignacionCompleta.id_asignacion})`,
                { id_asignacion: asignacionCompleta.id_asignacion }
            );
        }

        return asignacionCompleta;
    }

    async findAll(searchArgs: SearchArgs): Promise<AsignacionVendedor[]> {
        const { skip, take, search = '' } = searchArgs;
        const query = this.asignacionRepository.createQueryBuilder('asignacion')
        .leftJoinAndSelect('asignacion.vendedor', 'vendedor')
        .leftJoinAndSelect('asignacion.detalles', 'detalles')
        .leftJoinAndSelect('detalles.producto', 'producto')
        .offset(skip)
        .limit(take);

        // Si el usuario escribió algo en la barra de búsqueda
        if (search.trim() !== '') {
            const isNumber = !isNaN(Number(search));
            if (isNumber) {
                query.where('asignacion.id_asignacion = :id', { id: Number(search) }); // Busca por Folio
            } else {
                query.where('vendedor.nombre_completo LIKE :search', { search: `%${search}%` }); // Busca por Vendedor
            }
        }

        return query.orderBy('asignacion.id_asignacion', 'DESC').getMany();
    }

    async findOne(id_asignacion: number): Promise<AsignacionVendedor> {
        const asignacion = await this.asignacionRepository.findOne({
            where: { id_asignacion },
            relations: ['vendedor', 'vendedor.usuario', 'detalles', 'detalles.producto'],
        });
        if (!asignacion) throw new NotFoundException(`Asignación #${id_asignacion} no encontrada`);
        return asignacion;
    }

    async update(id_asignacion: number, updateAsignacionInput: UpdateAsignacionVendedorInput): Promise<AsignacionVendedor> {
        const asignacion = await this.findOne(id_asignacion);
        Object.assign(asignacion, updateAsignacionInput);
        await this.asignacionRepository.save(asignacion);
        return this.findOne(id_asignacion);
    }

    async remove(id_asignacion: number): Promise<boolean> {
        const resultado = await this.asignacionRepository.delete(id_asignacion);
        return (resultado.affected ?? 0) > 0;
    }
}
