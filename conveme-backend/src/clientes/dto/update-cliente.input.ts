import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { CreateClienteInput } from './create-cliente.input';
import { IsInt, IsNotEmpty } from 'class-validator'; // 🟢 IMPORTANTE

@InputType()
export class UpdateClienteInput extends PartialType(CreateClienteInput) {
  @Field(() => Int)
  @IsInt()
  @IsNotEmpty()
  id_cliente: number;
}
