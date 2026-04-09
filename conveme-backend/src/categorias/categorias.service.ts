import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Categoria } from './categoria.entity';
import { CreateCategoriaInput } from './dto/create-categoria.input';
import { UpdateCategoriaInput } from './dto/update-categoria.input';

@Injectable()
export class CategoriasService {
    constructor(
        @InjectRepository(Categoria)
        private readonly categoriaRepository: Repository<Categoria>,
    ) {}

    async create(createCategoriaInput: CreateCategoriaInput): Promise<Categoria> {
        // VALIDACIÓN: Buscar si ya existe (incluyendo inactivos)
        const existe = await this.categoriaRepository.findOne({ where: { nombre: createCategoriaInput.nombre } });

        if (existe) {
            if (existe.activo) {
                throw new ConflictException(`La categoría "${createCategoriaInput.nombre}" ya existe.`);
            } else {
                // Si existe pero está inactivo, lo reactivamos
                existe.activo = true;
                return await this.categoriaRepository.save(existe);
            }
        }

        const nueva = this.categoriaRepository.create(createCategoriaInput);
        const guardada = await this.categoriaRepository.save(nueva);
        return this.findOne(guardada.id_categoria);
    }

    async findAll(): Promise<Categoria[]> {
        // 🟢 QUITAMOS EL FILTRO de "activo: true" para que React Native decida si las muestra.
        return this.categoriaRepository.find({
            take: 50, // Límite de seguridad
            order: { id_categoria: 'DESC' } // Los últimos agregados aparecen primero
        });
    }

    async findOne(id_categoria: number): Promise<Categoria> {
        const categoria = await this.categoriaRepository.findOne({ where: { id_categoria } });
        if (!categoria) throw new NotFoundException(`Categoría #${id_categoria} no encontrada`);
        return categoria;
    }

    async update(id_categoria: number, updateCategoriaInput: UpdateCategoriaInput): Promise<Categoria> {
        if (updateCategoriaInput.nombre) {
            const existe = await this.categoriaRepository.findOne({ where: { nombre: updateCategoriaInput.nombre } });
            if (existe && existe.id_categoria !== id_categoria) {
                throw new ConflictException(`La categoría "${updateCategoriaInput.nombre}" ya está en uso.`);
            }
        }

        const categoria = await this.categoriaRepository.preload(updateCategoriaInput);
        if (!categoria) throw new NotFoundException(`Categoría #${id_categoria} no encontrada`);

        await this.categoriaRepository.save(categoria);
        return this.findOne(id_categoria);
    }

    async remove(id_categoria: number): Promise<Categoria> {
        const categoria = await this.findOne(id_categoria);
        // SOFT DELETE: apagamos el switch
        categoria.activo = false;
        await this.categoriaRepository.save(categoria);
        return categoria;
    }
}
