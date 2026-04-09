import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from './usuario.entity';
import { CreateUsuarioInput } from './dto/create-usuario.input';
import { UpdateUsuarioInput } from './dto/update-usuario.input';
import { Vendedor } from '../vendedores/vendedor.entity';
import { PaginationArgs } from '../common/dto/pagination.args';

@Injectable()
export class UsuariosService {
    constructor(
        @InjectRepository(Usuario)
        private readonly usuarioRepository: Repository<Usuario>,
        @InjectRepository(Vendedor)
        private readonly vendedorRepository: Repository<Vendedor>,
    ) {}

    async create(createUsuarioInput: CreateUsuarioInput): Promise<Usuario> {
        const { password_raw, ...restoDatos } = createUsuarioInput;
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password_raw, saltRounds);

        const nuevoUsuario = this.usuarioRepository.create({
            ...restoDatos,
            password_hash,
        });

        return this.usuarioRepository.save(nuevoUsuario);
    }

    async findAll(paginationArgs: PaginationArgs = { skip: 0, take: 20 }): Promise<Usuario[]> {
        const { skip, take } = paginationArgs;
        return this.usuarioRepository.find({ 
            relations: ['rol'],
            skip,
            take,
            order: { id_usuario: 'DESC' }
        });
    }

    async findByUsername(username: string): Promise<Usuario | null> {
        return this.usuarioRepository.findOne({ where: { username } });
    }

    async findOne(id_usuario: number): Promise<Usuario> {
        const usuario = await this.usuarioRepository.findOne({
            where: { id_usuario },
            relations: ['rol']
        });

        if (!usuario) throw new NotFoundException(`Usuario #${id_usuario} no encontrado`);
        return usuario;
    }

    async update(id_usuario: number, updateUsuarioInput: UpdateUsuarioInput): Promise<Usuario> {
        const usuario = await this.findOne(id_usuario);

        // Si manda un nuevo password, lo encriptamos
        if (updateUsuarioInput.password_raw) {
            usuario.password_hash = await bcrypt.hash(updateUsuarioInput.password_raw, 10);
        }

        // Sacamos el id_usuario del payload para que no choque con la PK al hacer Object.assign
        const { id_usuario: _, password_raw, ...datosAActualizar } = updateUsuarioInput;

        Object.assign(usuario, datosAActualizar);
        await this.usuarioRepository.save(usuario);
        
        // Recargamos el usuario completo para asegurar que campos como 'username' 
        // no lleguen nulos al resolver de GraphQL
        return this.findOne(id_usuario);
    }

    async remove(id_usuario: number): Promise<boolean> {
        const resultado = await this.usuarioRepository.delete(id_usuario);
        return (resultado.affected ?? 0) > 0;
    }

    async findVendedorByUsuario(id_usuario: number): Promise<Vendedor | null> {
        return this.vendedorRepository.findOne({ where: { usuario_id: id_usuario } });
    }

    async updatePushToken(id_usuario: number, push_token: string): Promise<Usuario> {
        const usuario = await this.findOne(id_usuario);
        usuario.push_token = push_token;
        return this.usuarioRepository.save(usuario);
    }
}
