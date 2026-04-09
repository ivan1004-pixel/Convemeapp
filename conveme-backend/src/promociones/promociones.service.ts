import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Promocion } from './promocion.entity';
import { CreatePromocionInput } from './dto/create-promocion.input';
import { UpdatePromocionInput } from './dto/update-promocion.input';

@Injectable()
export class PromocionesService {
    constructor(
        @InjectRepository(Promocion)
        private readonly promocionRepository: Repository<Promocion>,
    ) {}

    async create(createPromocionInput: CreatePromocionInput): Promise<Promocion> {
        const { fecha_inicio, fecha_fin, ...rest } = createPromocionInput;

        const nueva = this.promocionRepository.create({
            ...rest,
            fecha_inicio: new Date(fecha_inicio),
                                                      fecha_fin: new Date(fecha_fin),
                                                      activa: rest.activa ?? true,
        });

        return this.promocionRepository.save(nueva);
    }

    async findAll(): Promise<Promocion[]> {
        return this.promocionRepository.find();
    }

    async findOne(id_promocion: number): Promise<Promocion> {
        const promocion = await this.promocionRepository.findOne({
            where: { id_promocion },
        });
        if (!promocion) {
            throw new NotFoundException(
                `Promoción #${id_promocion} no encontrada`,
            );
        }
        return promocion;
    }

    async update(
        id_promocion: number,
        updatePromocionInput: UpdatePromocionInput,
    ): Promise<Promocion> {
        const promocion = await this.findOne(id_promocion);

        const {
            fecha_inicio,
            fecha_fin,
            ...rest
        } = updatePromocionInput;

        // Campos simples
        Object.assign(promocion, rest);

        // Fechas: solo si vienen en el input
        if (fecha_inicio !== undefined) {
            promocion.fecha_inicio = new Date(fecha_inicio);
        }
        if (fecha_fin !== undefined) {
            promocion.fecha_fin = new Date(fecha_fin);
        }

        await this.promocionRepository.save(promocion);
        return this.findOne(id_promocion);
    }

    async remove(id_promocion: number): Promise<boolean> {
        const resultado = await this.promocionRepository.delete(id_promocion);
        return (resultado.affected ?? 0) > 0;
    }
}
