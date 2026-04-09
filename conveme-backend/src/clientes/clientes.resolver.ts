import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { ClientesService } from './clientes.service';
import { Cliente } from './cliente.entity';
import { CreateClienteInput } from './dto/create-cliente.input';
import { UpdateClienteInput } from './dto/update-cliente.input';
import { PaginationArgs } from '../common/dto/pagination.args';

@Resolver(() => Cliente)
export class ClientesResolver {
  constructor(private readonly clientesService: ClientesService) {}

  @Mutation(() => Cliente)
  createCliente(@Args('createClienteInput') createClienteInput: CreateClienteInput) {
    return this.clientesService.create(createClienteInput);
  }

  @Query(() => [Cliente], { name: 'clientes' })
  findAll(@Args() paginationArgs: PaginationArgs) {
    return this.clientesService.findAll(paginationArgs);
  }

  // 👇 NUEVO: Exponemos el buscador para React
  @Query(() => [Cliente], { name: 'buscarClientes' })
  searchClientes(
    @Args('termino', { type: () => String, nullable: true }) termino?: string,
    @Args() paginationArgs?: PaginationArgs,
  ) {
    return this.clientesService.searchClientes(termino || '', paginationArgs);
  }

  @Query(() => Cliente, { name: 'cliente' })
  findOne(@Args('id_cliente', { type: () => Int }) id_cliente: number) {
    return this.clientesService.findOne(id_cliente);
  }

  @Mutation(() => Cliente)
  updateCliente(@Args('updateClienteInput') updateClienteInput: UpdateClienteInput) {
    return this.clientesService.update(updateClienteInput.id_cliente, updateClienteInput);
  }

  @Mutation(() => Boolean)
  removeCliente(@Args('id_cliente', { type: () => Int }) id_cliente: number) {
    return this.clientesService.remove(id_cliente);
  }
}
