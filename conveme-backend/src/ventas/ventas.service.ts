import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Venta } from './entities/venta.entity';
import { CreateVentaInput } from './dto/create-venta.input';
import { UpdateVentaInput } from './dto/update-venta.input';
import { PaginationArgs } from '../common/dto/pagination.args';
import { Usuario } from '../usuarios/usuario.entity';

@Injectable()
export class VentasService {
    constructor(
        @InjectRepository(Venta)
        private readonly ventaRepository: Repository<Venta>,
    ) {}

    async create(createVentaInput: CreateVentaInput): Promise<Venta> {
        // Validación: Una venta no puede estar vacía
        if (!createVentaInput.detalles || createVentaInput.detalles.length === 0) {
            throw new BadRequestException('La venta debe tener al menos un producto (detalle).');
        }

        // Ya no sobreescribimos el monto_total, respetamos el que envía el POS
        // (el cual ya trae el descuento de la promoción aplicado).
        const nuevaVenta = this.ventaRepository.create(createVentaInput);

        // Al guardar, TypeORM guardará la Venta y los DetVenta automáticamente
        const guardada = await this.ventaRepository.save(nuevaVenta);

        return this.findOne(guardada.id_venta);
    }

    async findAll(paginationArgs: PaginationArgs, usuario: Usuario): Promise<Venta[]> {
        const { skip, take } = paginationArgs;
        const queryBuilder = this.ventaRepository.createQueryBuilder('venta')
            .leftJoinAndSelect('venta.cliente', 'cliente')
            .leftJoinAndSelect('venta.vendedor', 'vendedor')
            .leftJoinAndSelect('venta.detalles', 'detalles')
            .leftJoinAndSelect('detalles.producto', 'producto')
            .orderBy('venta.fecha_venta', 'DESC')
            .offset(skip)
            .limit(take);

        if (usuario.rol_id === 2) {
            queryBuilder.andWhere('venta.vendedor_id = :vendedor_id', { vendedor_id: usuario.id_vendedor });
        }

        const results = await queryBuilder.getMany();
        return results.map(venta => {
            if (venta.fecha_venta && typeof venta.fecha_venta === 'string') {
                venta.fecha_venta = new Date(venta.fecha_venta);
            }
            return venta;
        });
    }

    async findOne(id_venta: number): Promise<Venta> {
        const venta = await this.ventaRepository.findOne({
            where: { id_venta },
            relations: ['cliente', 'vendedor', 'detalles', 'detalles.producto'],
        });
        if (!venta) throw new NotFoundException(`Venta #${id_venta} no encontrada`);

        if (venta.fecha_venta && typeof venta.fecha_venta === 'string') {
            venta.fecha_venta = new Date(venta.fecha_venta);
        }

        return venta;
    }

    async update(id_venta: number, updateVentaInput: UpdateVentaInput): Promise<Venta> {
        const { detalles, ...resto } = updateVentaInput;

        // 1. Buscar la venta con sus detalles actuales
        const ventaExistente = await this.ventaRepository.findOne({
            where: { id_venta },
            relations: ['detalles']
        });

        if (!ventaExistente) throw new NotFoundException(`Venta #${id_venta} no encontrada`);

        // 2. Si se enviaron detalles, manejamos la actualización de la colección
        if (detalles) {
            // Opción agresiva pero segura: eliminar detalles viejos y poner los nuevos
            // Esto evita el error "venta_id cannot be null" que lanza TypeORM al intentar desvincular
            await this.ventaRepository.manager.delete('det_ventas', { venta_id: id_venta });

            // Asignamos los nuevos detalles (TypeORM los insertará al guardar la venta por el cascade: true)
            ventaExistente.detalles = detalles as any;
        }

        // 3. Actualizar el resto de campos (monto_total, cliente_id, etc.)
        Object.assign(ventaExistente, resto);

        // 4. Guardar los cambios
        await this.ventaRepository.save(ventaExistente);

        return this.findOne(id_venta);
    }

    async remove(id_venta: number): Promise<boolean> {
        // En ventas, rara vez se borra permanentemente por temas contables,
        // pero como es la función remove base, la dejaremos como la pusiste.
        const resultado = await this.ventaRepository.delete(id_venta);
        return (resultado.affected ?? 0) > 0;
    }
}
