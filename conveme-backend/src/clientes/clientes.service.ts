import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from './cliente.entity';
import { CreateClienteInput } from './dto/create-cliente.input';
import { UpdateClienteInput } from './dto/update-cliente.input';
import { PaginationArgs } from '../common/dto/pagination.args';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
  ) {}

  async create(createClienteInput: CreateClienteInput): Promise<Cliente> {
    const nuevoCliente = this.clienteRepository.create(createClienteInput);
    const guardado = await this.clienteRepository.save(nuevoCliente);
    return this.findOne(guardado.id_cliente);
  }

  async findAll(paginationArgs: PaginationArgs = { skip: 0, take: 20 }): Promise<Cliente[]> {
    const { skip, take } = paginationArgs;
    return this.clienteRepository.find({
      relations: ['usuario'],
      skip,
      take,
      order: { id_cliente: 'DESC' }
    });
  }

  // 👇 NUEVO: Buscador predictivo para modales
  async searchClientes(termino: string = '', paginationArgs: PaginationArgs = { skip: 0, take: 20 }): Promise<Cliente[]> {
    const { skip, take } = paginationArgs;
    const query = this.clienteRepository.createQueryBuilder('cliente')
    .leftJoinAndSelect('cliente.usuario', 'usuario'); // Por si necesitas datos del usuario

    // Filtramos por nombre o correo
    if (termino.trim() !== '') {
      query.where('cliente.nombre_completo LIKE :termino', { termino: `%${termino}%` })
      .orWhere('cliente.email LIKE :termino', { termino: `%${termino}%` });
    }

    return query
      .orderBy('cliente.id_cliente', 'DESC')
      .offset(skip)
      .limit(take)
      .getMany();
  }

  async findOne(id_cliente: number): Promise<Cliente> {
    const cliente = await this.clienteRepository.findOne({
      where: { id_cliente },
      relations: ['usuario'],
    });
    if (!cliente) throw new NotFoundException(`Cliente #${id_cliente} no encontrado`);
    return cliente;
  }

  async update(id_cliente: number, updateClienteInput: UpdateClienteInput): Promise<Cliente> {
    const cliente = await this.findOne(id_cliente);
    Object.assign(cliente, updateClienteInput);
    await this.clienteRepository.save(cliente);
    return this.findOne(id_cliente);
  }

  async remove(id_cliente: number): Promise<boolean> {
    const resultado = await this.clienteRepository.delete(id_cliente);
    return (resultado.affected ?? 0) > 0;
  }
}
