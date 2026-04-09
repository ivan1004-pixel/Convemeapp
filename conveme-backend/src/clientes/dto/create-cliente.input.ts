import { InputType, Int, Field } from '@nestjs/graphql';
import { IsString, IsOptional, IsInt, IsEmail } from 'class-validator'; // 🟢 IMPORTANTE

@InputType()
export class CreateClienteInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  usuario_id?: number;

  @Field()
  @IsString()
  nombre_completo: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail() // 🟢 Valida que sea un email real
  email?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  telefono?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  direccion_envio?: string;
}
