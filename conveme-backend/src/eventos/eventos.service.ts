import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Evento } from './entities/evento.entity';
import { CreateEventoInput } from './dto/create-evento.input';
import { UpdateEventoInput } from './dto/update-evento.input';

@Injectable()
export class EventosService {
    constructor(
        @InjectRepository(Evento)
        private readonly eventoRepository: Repository<Evento>,
    ) {}

    async create(createEventoInput: CreateEventoInput): Promise<Evento> {
        const payload: Partial<Evento> = {
            nombre: createEventoInput.nombre,
            descripcion: createEventoInput.descripcion,
            escuela_id: createEventoInput.escuela_id,
            municipio_id: createEventoInput.municipio_id,
            costo_stand: createEventoInput.costo_stand,
            activo: createEventoInput.activo ?? true,
        };

        // Convertir string => Date si vienen
        if (createEventoInput.fecha_inicio) {
            payload.fecha_inicio = new Date(createEventoInput.fecha_inicio);
        } else {
            // si quieres puedes usar new Date() o dejar que la DB tenga default
            // payload.fecha_inicio = new Date();
        }

        if (createEventoInput.fecha_fin) {
            payload.fecha_fin = new Date(createEventoInput.fecha_fin);
        } else {
            // payload.fecha_fin = payload.fecha_inicio ?? new Date();
        }

        const nuevo = this.eventoRepository.create(payload);
        const guardado = await this.eventoRepository.save(nuevo);
        return this.findOne(guardado.id_evento);
    }

    async findAll(): Promise<Evento[]> {
        return this.eventoRepository.find({
            where: { activo: true }, // Solo eventos activos
            relations: ['escuela', 'municipio', 'municipio.estado'],
        });
    }

    async findOne(id_evento: number): Promise<Evento> {
        const evento = await this.eventoRepository.findOne({
            where: { id_evento },
            relations: ['escuela', 'municipio', 'municipio.estado'],
        });
        if (!evento) {
            throw new NotFoundException(`Evento #${id_evento} no encontrado`);
        }
        return evento;
    }

    async update(
        id_evento: number,
        updateEventoInput: UpdateEventoInput,
    ): Promise<Evento> {
        // Primero buscamos
        const evento = await this.eventoRepository.findOne({ where: { id_evento } });
        if (!evento) {
            throw new NotFoundException(`Evento #${id_evento} no encontrado`);
        }

        // Mezclamos campos escalares
        if (updateEventoInput.nombre !== undefined) {
            evento.nombre = updateEventoInput.nombre;
        }
        if (updateEventoInput.descripcion !== undefined) {
            evento.descripcion = updateEventoInput.descripcion;
        }
        if (updateEventoInput.escuela_id !== undefined) {
            evento.escuela_id = updateEventoInput.escuela_id;
        }
        if (updateEventoInput.municipio_id !== undefined) {
            evento.municipio_id = updateEventoInput.municipio_id;
        }
        if (updateEventoInput.costo_stand !== undefined) {
            evento.costo_stand = updateEventoInput.costo_stand;
        }
        if (updateEventoInput.activo !== undefined) {
            evento.activo = updateEventoInput.activo;
        }

        // Fechas: si vienen string, convertirlas a Date. Si no vienen, NO tocar.
        if (updateEventoInput.fecha_inicio !== undefined) {
            if (updateEventoInput.fecha_inicio) {
                evento.fecha_inicio = new Date(updateEventoInput.fecha_inicio);
            }
            // si está vacío (''), puedes decidir si lo ignoras o pones un default
        }

        if (updateEventoInput.fecha_fin !== undefined) {
            if (updateEventoInput.fecha_fin) {
                evento.fecha_fin = new Date(updateEventoInput.fecha_fin);
            }
        }

        await this.eventoRepository.save(evento);
        return this.findOne(id_evento);
    }

    async remove(id_evento: number): Promise<Evento> {
        const evento = await this.findOne(id_evento);
        evento.activo = false; // Soft Delete
        await this.eventoRepository.save(evento);
        return evento;
    }
}
