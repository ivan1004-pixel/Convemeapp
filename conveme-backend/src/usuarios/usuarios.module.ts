import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosService } from './usuarios.service';
import { UsuariosResolver } from './usuarios.resolver';
import { Usuario } from './usuario.entity';
import { Vendedor } from '../vendedores/vendedor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Vendedor])],
  providers: [UsuariosResolver, UsuariosService],
  exports: [UsuariosService],
})
export class UsuariosModule {}
